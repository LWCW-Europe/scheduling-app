import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { setupTestDb, resetTestDb } from "../helpers/db";
import {
  createEvent,
  createGuest,
  createLocation,
  createDay,
} from "../helpers/factories";
import { getRepositories } from "@/db/container";
import { POST as addPOST } from "@/app/api/add-session/route";
import { POST } from "@/app/api/update-session/route";
import type { SessionParams } from "@/app/api/session-form-utils";
import type { Day, Guest, Location } from "@/db/repositories/interfaces";

function makeAddReq(payload: unknown): Request {
  return new Request("http://test/api/add-session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function makeUpdateReq(payload: unknown): Request {
  return new Request("http://test/api/update-session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function basePayload(
  host: Guest,
  location: Location,
  day: Day,
  overrides?: Partial<SessionParams>
): Omit<SessionParams, "id"> {
  return {
    title: "Test Session",
    description: "",
    closed: false,
    hosts: [host],
    location,
    day,
    startTimeMinutes: 10 * 60,
    duration: 60,
    timezone: "UTC",
    ...overrides,
  };
}

/** Creates a session via add-session and returns its id. */
async function createScheduledSession(
  eventId: string,
  host: Guest,
  location: Location,
  day: Day,
  overrides?: Partial<SessionParams>
): Promise<string> {
  const res = await addPOST(
    makeAddReq(basePayload(host, location, day, overrides))
  );
  expect(res.ok).toBe(true);
  const sessions = await getRepositories().sessions.listByEvent(eventId);
  const title = overrides?.title ?? "Test Session";
  return sessions.find((s) => s.title === title)!.id;
}

describe("POST /api/update-session", () => {
  beforeAll(() => setupTestDb());
  beforeEach(() => resetTestDb());

  it("changes time without conflict; re-fetched session reflects new time", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const location = await createLocation();
    const day = await createDay(event.id);

    const id = await createScheduledSession(event.id, guest, location, day, {
      startTimeMinutes: 10 * 60,
    });
    const before = (await getRepositories().sessions.findById(id))!;

    const res = await POST(
      makeUpdateReq({
        ...basePayload(guest, location, day, { startTimeMinutes: 12 * 60 }),
        id,
      })
    );
    expect(res.ok).toBe(true);

    const after = (await getRepositories().sessions.findById(id))!;
    expect(after.startTime!.getTime()).toBeGreaterThan(
      before.startTime!.getTime()
    );
  });

  it("rejects move to colliding slot; session remains unchanged", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const location = await createLocation();
    const day = await createDay(event.id);

    await createScheduledSession(event.id, guest, location, day, {
      title: "Anchor",
      startTimeMinutes: 10 * 60,
    });
    const movingId = await createScheduledSession(
      event.id,
      guest,
      location,
      day,
      {
        title: "Moving",
        startTimeMinutes: 12 * 60,
      }
    );
    const originalTime = (await getRepositories().sessions.findById(movingId))!
      .startTime;

    const res = await POST(
      makeUpdateReq({
        ...basePayload(guest, location, day, {
          title: "Moving",
          startTimeMinutes: 10 * 60 + 30,
        }),
        id: movingId,
      })
    );
    expect(res.ok).toBe(false);

    const unchanged = (await getRepositories().sessions.findById(movingId))!;
    expect(unchanged.startTime!.getTime()).toBe(originalTime!.getTime());
  });

  it("does not collide with itself when re-saved with the same slot", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const location = await createLocation();
    const day = await createDay(event.id);

    const id = await createScheduledSession(event.id, guest, location, day);

    const res = await POST(
      makeUpdateReq({ ...basePayload(guest, location, day), id })
    );
    expect(res.ok).toBe(true);
  });

  it("updates location, hosts, and capacity; re-fetched session reflects each", async () => {
    const event = await createEvent();
    const host1 = await createGuest({ name: "Host 1" });
    const host2 = await createGuest({ name: "Host 2" });
    const loc1 = await createLocation({ name: "Workshop Room", capacity: 20 });
    const loc2 = await createLocation({ name: "Garden Terrace", capacity: 50 });
    const day = await createDay(event.id);

    const id = await createScheduledSession(event.id, host1, loc1, day);

    const res = await POST(
      makeUpdateReq({ ...basePayload(host2, loc2, day), id })
    );
    expect(res.ok).toBe(true);

    const updated = (await getRepositories().sessions.findById(id))!;
    expect(updated.hosts[0].id).toBe(host2.id);
    expect(updated.locations[0].id).toBe(loc2.id);
    expect(updated.capacity).toBe(50);
  });
});
