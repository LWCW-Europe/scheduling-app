#!/usr/bin/env tsx
/**
 * Interactive admin CLI for managing events and guests directly in the DB.
 * Run via: bun dev:admin
 */
import * as p from "@clack/prompts";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
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

  db.update(schema.events)
    .set({
      name: name as string,
      description: description as string,
      website: website as string,
      start,
      end,
      maxSessionDuration,
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
        { value: "exit", label: "Exit" },
      ],
    });
    cancelCheck(section);
    if (section === "exit") break;

    if (section === "events") await manageEvents(db);
    else if (section === "guests") await manageGuests(db);
  }

  p.outro("Done.");
}

main().catch((err) => {
  p.log.error(String(err));
  process.exit(1);
});
