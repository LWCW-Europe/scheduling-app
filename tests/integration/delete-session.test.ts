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
import { POST } from "@/app/api/delete-session/route";
import type { SessionParams } from "@/app/api/session-form-utils";
import type { Day, Guest, Location } from "@/db/repositories/interfaces";

function makeAddReq(payload: unknown): Request {
  return new Request("http://test/api/add-session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function makeDeleteReq(id: string): Request {
  return new Request("http://test/api/delete-session", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

async function createScheduledSession(
  eventId: string,
  host: Guest,
  location: Location,
  day: Day,
  overrides?: Partial<SessionParams>
): Promise<string> {
  const payload: SessionParams = {
    title: "Test Session",
    description: "",
    closed: false,
    hosts: [host],
    location,
    day,
    startTimeString: "10:00 AM",
    duration: 60,
    timezone: "UTC",
    ...overrides,
  };
  const res = await addPOST(makeAddReq(payload));
  expect(res.ok).toBe(true);
  const sessions = await getRepositories().sessions.listByEvent(eventId);
  const title = overrides?.title ?? "Test Session";
  return sessions.find((s) => s.title === title)!.id;
}

describe("POST /api/delete-session", () => {
  beforeAll(() => setupTestDb());
  beforeEach(() => resetTestDb());

  it("deleted session is absent from listByEvent", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const location = await createLocation();
    const day = await createDay(event.id);

    const id = await createScheduledSession(event.id, guest, location, day);

    const res = await POST(makeDeleteReq(id));
    expect(res.ok).toBe(true);

    const sessions = await getRepositories().sessions.listByEvent(event.id);
    expect(sessions).toHaveLength(0);
  });

  it("RSVPs for the deleted session are removed", async () => {
    const event = await createEvent();
    const host = await createGuest({ name: "Host" });
    const attendee = await createGuest({ name: "Attendee" });
    const location = await createLocation();
    const day = await createDay(event.id);

    const sessionId = await createScheduledSession(
      event.id,
      host,
      location,
      day
    );
    await getRepositories().rsvps.create({ sessionId, guestId: attendee.id });

    const before = await getRepositories().rsvps.listByGuest(attendee.id);
    expect(before).toHaveLength(1);

    const res = await POST(makeDeleteReq(sessionId));
    expect(res.ok).toBe(true);

    const after = await getRepositories().rsvps.listByGuest(attendee.id);
    expect(after).toHaveLength(0);
  });
});
