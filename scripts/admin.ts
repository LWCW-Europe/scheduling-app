#!/usr/bin/env tsx
/**
 * Interactive admin CLI for managing events and guests directly in the DB.
 * Run via: bun dev:admin
 */
import * as p from "@clack/prompts";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq, inArray } from "drizzle-orm";
import fs from "fs";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "../db/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function openDb() {
  const url = process.env.DATABASE_URL ?? "file:./data.db";
  const sqlite = new Database(url.replace(/^file:/, ""));
  const db = drizzle(sqlite, { schema });
  migrate(db, {
    migrationsFolder: path.join(__dirname, "../drizzle"),
  });
  return db;
}

type DB = ReturnType<typeof openDb>;

// ── Timezone helpers ──────────────────────────────────────────────────────────

const MAX_TZ_OPTIONS = 9;

async function promptTimezone(current?: string): Promise<string> {
  const hint = `current: ${current ?? "UTC"} — type to search (e.g. "America/New_York", "Europe/Berlin")`;
  const searchTerm = await p.text({
    message: "Timezone (type to search)",
    placeholder: hint,
  });
  cancelCheck(searchTerm);

  const term = (searchTerm as string).trim() || (current ?? "UTC");

  const allZones: string[] = Intl.supportedValuesOf("timeZone");

  if (allZones.includes(term)) return term;

  const matches = allZones.filter((tz) =>
    tz.toLowerCase().includes(term.toLowerCase())
  );

  if (matches.length === 0) {
    p.log.error(
      `No timezone matching "${term}". Try "America/New_York", "Europe/Berlin", "UTC", etc.`
    );
    return promptTimezone(current);
  }

  if (matches.length === 1) {
    p.log.info(`Using timezone: ${matches[0]}`);
    return matches[0];
  }

  if (matches.length > MAX_TZ_OPTIONS) {
    p.log.warn(
      `${matches.length} matches for "${term}" — too many to list. Be more specific (e.g. "America/New" instead of "America").`
    );
    return promptTimezone(current);
  }

  const selected = await p.select({
    message: "Select timezone",
    options: matches.map((tz) => ({ value: tz, label: tz })),
  });
  cancelCheck(selected);
  return selected as string;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function displayDate(iso: string | null | undefined): string {
  if (!iso) return "(not set)";
  return iso.replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

function parseDate(input: string): string | null {
  const s = input.trim();
  if (s === "" || s === "(not set)") return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: "${s}"`);
  return d.toISOString();
}

function cancelCheck(value: unknown): void {
  if (p.isCancel(value)) {
    p.outro("Cancelled.");
    process.exit(0);
  }
}

async function promptDate(
  message: string,
  current: string | null | undefined
): Promise<string | null> {
  const hint = `current: ${displayDate(current)} — enter ISO datetime or leave blank to clear`;
  const raw = await p.text({ message, placeholder: hint });
  cancelCheck(raw);
  const s = (raw as string).trim();
  if (s === "") return null;
  try {
    return parseDate(s);
  } catch {
    p.log.error(`Invalid date "${s}". Use format: 2025-06-01T09:00:00Z`);
    return promptDate(message, current);
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

function formatEventSummary(e: typeof schema.events.$inferSelect): string {
  const lines = [
    `Name:  ${e.name}`,
    `ID:    ${e.id}`,
    `Dates: ${displayDate(e.start)} → ${displayDate(e.end)}`,
    `Proposal phase:   ${displayDate(e.proposalPhaseStart)} → ${displayDate(e.proposalPhaseEnd)}`,
    `Voting phase:     ${displayDate(e.votingPhaseStart)} → ${displayDate(e.votingPhaseEnd)}`,
    `Scheduling phase: ${displayDate(e.schedulingPhaseStart)} → ${displayDate(e.schedulingPhaseEnd)}`,
    `Max session duration: ${e.maxSessionDuration} minutes`,
    `Timezone: ${e.timezone}`,
  ];
  if (e.description) lines.push(`Desc:  ${e.description}`);
  if (e.website) lines.push(`Web:   ${e.website}`);
  return lines.join("\n");
}

function listEvents(db: DB): void {
  const events = db.select().from(schema.events).all();
  if (events.length === 0) {
    p.note("No events found.", "Events");
    return;
  }
  p.note(events.map(formatEventSummary).join("\n\n─────\n\n"), "Events");
}

async function createEvent(db: DB): Promise<void> {
  p.log.step("Create event");

  const name = await p.text({ message: "Name" });
  cancelCheck(name);

  const description = await p.text({
    message: "Description",
    placeholder: "(optional)",
  });
  cancelCheck(description);

  const website = await p.text({
    message: "Website",
    placeholder: "(optional)",
  });
  cancelCheck(website);

  const startRaw = await p.text({
    message: "Start date (ISO, e.g. 2025-06-01T09:00:00Z)",
  });
  cancelCheck(startRaw);

  const endRaw = await p.text({
    message: "End date (ISO, e.g. 2025-06-03T18:00:00Z)",
  });
  cancelCheck(endRaw);

  let start: string, end: string;
  try {
    start = parseDate(startRaw as string) as string;
    end = parseDate(endRaw as string) as string;
  } catch (err) {
    p.log.error(String(err));
    return;
  }

  const maxSessionDurationRaw = await p.text({
    message: "Max session duration (minutes)",
    placeholder: "120",
    defaultValue: "120",
  });
  cancelCheck(maxSessionDurationRaw);
  const parsedDuration = parseInt(maxSessionDurationRaw as string, 10) || 120;
  const maxSessionDuration = Math.max(30, Math.round(parsedDuration / 30) * 30);
  if (maxSessionDuration !== parsedDuration) {
    p.log.warn(`Rounded to nearest 30 minutes: ${maxSessionDuration}`);
  }

  const timezone = await promptTimezone("UTC");

  const id = nanoid();
  db.insert(schema.events)
    .values({
      id,
      name: name as string,
      description: (description as string) || "",
      website: (website as string) || "",
      start,
      end,
      maxSessionDuration,
      timezone,
    })
    .run();

  p.log.success(`Created event "${name as string}" (${id})`);
}

async function pickEvent(
  db: DB
): Promise<typeof schema.events.$inferSelect | null> {
  const events = db.select().from(schema.events).all();
  if (events.length === 0) {
    p.log.warn("No events found.");
    return null;
  }
  const id = await p.select({
    message: "Select event",
    options: events.map((e) => ({ value: e.id, label: e.name })),
  });
  cancelCheck(id);
  return events.find((e) => e.id === id) ?? null;
}

async function editEventBasicInfo(
  db: DB,
  event: typeof schema.events.$inferSelect
): Promise<void> {
  const name = await p.text({
    message: "Name",
    initialValue: event.name,
  });
  cancelCheck(name);

  const description = await p.text({
    message: "Description",
    initialValue: event.description,
  });
  cancelCheck(description);

  const website = await p.text({
    message: "Website",
    initialValue: event.website,
  });
  cancelCheck(website);

  const startRaw = await p.text({
    message: "Start date (ISO)",
    initialValue: event.start,
  });
  cancelCheck(startRaw);

  const endRaw = await p.text({
    message: "End date (ISO)",
    initialValue: event.end,
  });
  cancelCheck(endRaw);

  let start: string, end: string;
  try {
    start = parseDate(startRaw as string) as string;
    end = parseDate(endRaw as string) as string;
  } catch (err) {
    p.log.error(String(err));
    return;
  }

  const maxSessionDurationRaw = await p.text({
    message: "Max session duration (minutes)",
    initialValue: String(event.maxSessionDuration),
  });
  cancelCheck(maxSessionDurationRaw);
  const parsedDuration = parseInt(maxSessionDurationRaw as string, 10) || 120;
  const maxSessionDuration = Math.max(30, Math.round(parsedDuration / 30) * 30);
  if (maxSessionDuration !== parsedDuration) {
    p.log.warn(`Rounded to nearest 30 minutes: ${maxSessionDuration}`);
  }

  const timezone = await promptTimezone(event.timezone);

  db.update(schema.events)
    .set({
      name: name as string,
      description: description as string,
      website: website as string,
      start,
      end,
      maxSessionDuration,
      timezone,
    })
    .where(eq(schema.events.id, event.id))
    .run();

  p.log.success("Event updated.");
}

async function editEventPhases(
  db: DB,
  event: typeof schema.events.$inferSelect
): Promise<void> {
  p.log.step("Edit phase dates (leave blank to clear a date)");

  const proposalPhaseStart = await promptDate(
    "Proposal phase start",
    event.proposalPhaseStart
  );
  const proposalPhaseEnd = await promptDate(
    "Proposal phase end",
    event.proposalPhaseEnd
  );
  const votingPhaseStart = await promptDate(
    "Voting phase start",
    event.votingPhaseStart
  );
  const votingPhaseEnd = await promptDate(
    "Voting phase end",
    event.votingPhaseEnd
  );
  const schedulingPhaseStart = await promptDate(
    "Scheduling phase start",
    event.schedulingPhaseStart
  );
  const schedulingPhaseEnd = await promptDate(
    "Scheduling phase end",
    event.schedulingPhaseEnd
  );

  db.update(schema.events)
    .set({
      proposalPhaseStart,
      proposalPhaseEnd,
      votingPhaseStart,
      votingPhaseEnd,
      schedulingPhaseStart,
      schedulingPhaseEnd,
    })
    .where(eq(schema.events.id, event.id))
    .run();

  p.log.success("Phases updated.");
}

async function deleteEvent(db: DB): Promise<void> {
  const event = await pickEvent(db);
  if (!event) return;

  const confirm = await p.confirm({
    message: `Delete "${event.name}"? This cannot be undone.`,
    initialValue: false,
  });
  cancelCheck(confirm);
  if (!confirm) {
    p.log.info("Cancelled.");
    return;
  }

  const sessionIds = db
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(eq(schema.sessions.eventId, event.id))
    .all()
    .map((s) => s.id);

  if (sessionIds.length > 0) {
    db.delete(schema.rsvps)
      .where(inArray(schema.rsvps.sessionId, sessionIds))
      .run();
    db.delete(schema.sessionHosts)
      .where(inArray(schema.sessionHosts.sessionId, sessionIds))
      .run();
    db.delete(schema.sessionLocations)
      .where(inArray(schema.sessionLocations.sessionId, sessionIds))
      .run();
  }

  const proposalIds = db
    .select({ id: schema.sessionProposals.id })
    .from(schema.sessionProposals)
    .where(eq(schema.sessionProposals.eventId, event.id))
    .all()
    .map((sp) => sp.id);

  if (proposalIds.length > 0) {
    db.delete(schema.votes)
      .where(inArray(schema.votes.proposalId, proposalIds))
      .run();
    db.delete(schema.proposalHosts)
      .where(inArray(schema.proposalHosts.proposalId, proposalIds))
      .run();
  }

  db.delete(schema.sessions).where(eq(schema.sessions.eventId, event.id)).run();
  db.delete(schema.sessionProposals)
    .where(eq(schema.sessionProposals.eventId, event.id))
    .run();
  db.delete(schema.eventLocations)
    .where(eq(schema.eventLocations.eventId, event.id))
    .run();
  db.delete(schema.eventGuests)
    .where(eq(schema.eventGuests.eventId, event.id))
    .run();
  db.delete(schema.days).where(eq(schema.days.eventId, event.id)).run();
  db.delete(schema.events).where(eq(schema.events.id, event.id)).run();
  p.log.success(`Deleted "${event.name}".`);
}

async function manageEvents(db: DB): Promise<void> {
  while (true) {
    const action = await p.select({
      message: "Events",
      options: [
        { value: "list", label: "List" },
        { value: "create", label: "Create" },
        { value: "edit-info", label: "Edit basic info" },
        { value: "edit-phases", label: "Edit phases" },
        { value: "delete", label: "Delete" },
        { value: "back", label: "← Back" },
      ],
    });
    cancelCheck(action);
    if (action === "back") return;

    if (action === "list") {
      listEvents(db);
    } else if (action === "create") {
      await createEvent(db);
    } else if (action === "edit-info") {
      const event = await pickEvent(db);
      if (event) await editEventBasicInfo(db, event);
    } else if (action === "edit-phases") {
      const event = await pickEvent(db);
      if (event) await editEventPhases(db, event);
    } else if (action === "delete") {
      await deleteEvent(db);
    }
  }
}

// ── Guests ────────────────────────────────────────────────────────────────────

function listGuests(db: DB): void {
  const guests = db.select().from(schema.guests).all();
  if (guests.length === 0) {
    p.note("No guests found.", "Guests");
    return;
  }
  const lines = guests.map((g) => `${g.name} <${g.email}>  (${g.id})`);
  p.note(lines.join("\n"), "Guests");
}

async function createGuest(db: DB): Promise<void> {
  p.log.step("Create guest");

  const name = await p.text({ message: "Name" });
  cancelCheck(name);

  const email = await p.text({ message: "Email" });
  cancelCheck(email);

  const id = nanoid();
  db.insert(schema.guests)
    .values({ id, name: name as string, email: email as string })
    .run();
  p.log.success(`Created guest "${name as string}" (${id})`);
}

async function pickGuest(
  db: DB
): Promise<typeof schema.guests.$inferSelect | null> {
  const guests = db.select().from(schema.guests).all();
  if (guests.length === 0) {
    p.log.warn("No guests found.");
    return null;
  }
  const id = await p.select({
    message: "Select guest",
    options: guests.map((g) => ({
      value: g.id,
      label: `${g.name} <${g.email}>`,
    })),
  });
  cancelCheck(id);
  return guests.find((g) => g.id === id) ?? null;
}

async function editGuest(db: DB): Promise<void> {
  const guest = await pickGuest(db);
  if (!guest) return;

  const name = await p.text({ message: "Name", initialValue: guest.name });
  cancelCheck(name);

  const email = await p.text({ message: "Email", initialValue: guest.email });
  cancelCheck(email);

  db.update(schema.guests)
    .set({ name: name as string, email: email as string })
    .where(eq(schema.guests.id, guest.id))
    .run();

  p.log.success("Guest updated.");
}

async function deleteGuest(db: DB): Promise<void> {
  const guest = await pickGuest(db);
  if (!guest) return;

  const confirm = await p.confirm({
    message: `Delete "${guest.name}"? This cannot be undone.`,
    initialValue: false,
  });
  cancelCheck(confirm);
  if (!confirm) {
    p.log.info("Cancelled.");
    return;
  }

  db.delete(schema.guests).where(eq(schema.guests.id, guest.id)).run();
  p.log.success(`Deleted "${guest.name}".`);
}

async function assignGuestToEvent(db: DB): Promise<void> {
  const guest = await pickGuest(db);
  if (!guest) return;

  const event = await pickEvent(db);
  if (!event) return;

  const existing = db
    .select()
    .from(schema.eventGuests)
    .where(eq(schema.eventGuests.guestId, guest.id))
    .all()
    .find((r) => r.eventId === event.id);

  if (existing) {
    p.log.warn(`"${guest.name}" is already in "${event.name}".`);
    return;
  }

  db.insert(schema.eventGuests)
    .values({ eventId: event.id, guestId: guest.id })
    .run();

  p.log.success(`Assigned "${guest.name}" to "${event.name}".`);
}

async function removeGuestFromEvent(db: DB): Promise<void> {
  const event = await pickEvent(db);
  if (!event) return;

  const guests = db
    .select({
      id: schema.guests.id,
      name: schema.guests.name,
      email: schema.guests.email,
    })
    .from(schema.guests)
    .innerJoin(
      schema.eventGuests,
      eq(schema.guests.id, schema.eventGuests.guestId)
    )
    .where(eq(schema.eventGuests.eventId, event.id))
    .all();

  if (guests.length === 0) {
    p.log.warn(`No guests in "${event.name}".`);
    return;
  }

  const guestId = await p.select({
    message: "Remove guest from event",
    options: guests.map((g) => ({
      value: g.id,
      label: `${g.name} <${g.email}>`,
    })),
  });
  cancelCheck(guestId);

  db.delete(schema.eventGuests)
    .where(eq(schema.eventGuests.guestId, guestId as string))
    .run();

  p.log.success("Guest removed from event.");
}

async function manageGuests(db: DB): Promise<void> {
  while (true) {
    const action = await p.select({
      message: "Guests",
      options: [
        { value: "list", label: "List" },
        { value: "create", label: "Create" },
        { value: "edit", label: "Edit" },
        { value: "delete", label: "Delete" },
        { value: "assign", label: "Assign to event" },
        { value: "remove", label: "Remove from event" },
        { value: "back", label: "← Back" },
      ],
    });
    cancelCheck(action);
    if (action === "back") return;

    if (action === "list") listGuests(db);
    else if (action === "create") await createGuest(db);
    else if (action === "edit") await editGuest(db);
    else if (action === "delete") await deleteGuest(db);
    else if (action === "assign") await assignGuestToEvent(db);
    else if (action === "remove") await removeGuestFromEvent(db);
  }
}

// ── Locations ─────────────────────────────────────────────────────────────────

const LOCATION_IMAGE_NOTE =
  "Images must be 4:3 aspect ratio (e.g. 800×600 or 1200×900). " +
  "Supported formats: JPEG, PNG, WebP.";

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function listLocations(db: DB): void {
  const locations = db.select().from(schema.locations).all();
  if (locations.length === 0) {
    p.note("No locations found.", "Locations");
    return;
  }
  const lines = locations.map((l) => {
    const parts = [`${l.name}  (${l.id})`];
    parts.push(`  Image:    ${l.imageUrl || "(none)"}`);
    if (l.description) parts.push(`  Desc:     ${l.description}`);
    parts.push(
      `  Capacity: ${l.capacity}  Hidden: ${l.hidden}  Bookable: ${l.bookable}`
    );
    return parts.join("\n");
  });
  p.note(lines.join("\n\n─────\n\n"), "Locations");
}

async function setLocationImage(db: DB): Promise<void> {
  const locations = db.select().from(schema.locations).all();
  if (locations.length === 0) {
    p.log.warn("No locations found.");
    return;
  }

  const locationId = await p.select({
    message: "Select location",
    options: locations.map((l) => ({
      value: l.id,
      label: `${l.name}${l.imageUrl ? " (has image)" : ""}`,
    })),
  });
  cancelCheck(locationId);
  const location = locations.find((l) => l.id === locationId)!;

  p.log.info(LOCATION_IMAGE_NOTE);

  const sourcePath = await p.text({
    message: "Path to image file",
    placeholder: "/path/to/image.jpg",
  });
  cancelCheck(sourcePath);

  const resolvedSource = path.resolve(sourcePath as string);
  if (!fs.existsSync(resolvedSource)) {
    p.log.error(`File not found: ${resolvedSource}`);
    return;
  }

  const ext = path.extname(resolvedSource).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    p.log.error(
      `Unsupported format "${ext}". Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`
    );
    return;
  }

  const outputDir = path.join(__dirname, "../public/locations");
  fs.mkdirSync(outputDir, { recursive: true });

  const destFilename = `${location.id}${ext}`;
  const destPath = path.join(outputDir, destFilename);
  fs.copyFileSync(resolvedSource, destPath);

  const imageUrl = `/locations/${destFilename}`;
  db.update(schema.locations)
    .set({ imageUrl })
    .where(eq(schema.locations.id, location.id))
    .run();

  p.log.success(`Image set for "${location.name}": ${imageUrl}`);
}

async function manageLocations(db: DB): Promise<void> {
  while (true) {
    const action = await p.select({
      message: "Locations",
      options: [
        { value: "list", label: "List" },
        { value: "set-image", label: "Set image" },
        { value: "back", label: "← Back" },
      ],
    });
    cancelCheck(action);
    if (action === "back") return;

    if (action === "list") listLocations(db);
    else if (action === "set-image") await setLocationImage(db);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const db = openDb();
  p.intro("Scheduling App Admin");

  while (true) {
    const section = await p.select({
      message: "What do you want to manage?",
      options: [
        { value: "events", label: "Events" },
        { value: "guests", label: "Guests" },
        { value: "locations", label: "Locations" },
        { value: "exit", label: "Exit" },
      ],
    });
    cancelCheck(section);
    if (section === "exit") break;

    if (section === "events") await manageEvents(db);
    else if (section === "guests") await manageGuests(db);
    else if (section === "locations") await manageLocations(db);
  }

  p.outro("Done.");
}

main().catch((err) => {
  p.log.error(String(err));
  process.exit(1);
});
