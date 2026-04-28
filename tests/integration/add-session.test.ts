import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { setupTestDb, resetTestDb } from "../helpers/db";
import {
  createEvent,
  createGuest,
  createLocation,
  createDay,
} from "../helpers/factories";
import { getRepositories } from "@/db/container";
import { POST } from "@/app/api/add-session/route";
import type { SessionParams } from "@/app/api/session-form-utils";
import type { Day, Guest, Location } from "@/db/repositories/interfaces";

function makeReq(payload: unknown): Request {
  return new Request("http://test/api/add-session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function buildPayload(
  host: Guest,
  location: Location,
  day: Day,
  overrides?: Partial<SessionParams>
): SessionParams {
  return {
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
}

describe("POST /api/add-session", () => {
  beforeAll(() => setupTestDb());
  beforeEach(() => resetTestDb());

  it("creates a session and returns success", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const location = await createLocation();
    const day = await createDay(event.id);

    const res = await POST(makeReq(buildPayload(guest, location, day)));

    expect(res.ok).toBe(true);
    expect(await res.json()).toMatchObject({ success: true });

    const sessions = await getRepositories().sessions.listByEvent(event.id);
    expect(sessions).toHaveLength(1);
    const [session] = sessions;
    expect(session.title).toBe("Test Session");
    expect(session.hosts[0].id).toBe(guest.id);
    expect(session.locations[0].id).toBe(location.id);
    expect(session.startTime).toBeDefined();
    expect(session.endTime!.getTime() - session.startTime!.getTime()).toBe(
      60 * 60 * 1000
    );
  });

  it("rejects overlap in same location; only the pre-existing session remains", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const location = await createLocation();
    const day = await createDay(event.id);

    const r1 = await POST(
      makeReq(buildPayload(guest, location, day, { title: "First" }))
    );
    expect(r1.ok).toBe(true);

    // Starts 30 min into the first session — overlaps
    const r2 = await POST(
      makeReq(
        buildPayload(guest, location, day, {
          title: "Overlap",
          startTimeString: "10:30 AM",
        })
      )
    );
    expect(r2.ok).toBe(false);

    const sessions = await getRepositories().sessions.listByEvent(event.id);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].title).toBe("First");
  });

  it("accepts overlap in different location; both sessions are listed", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const locA = await createLocation({ name: "Room A" });
    const locB = await createLocation({ name: "Room B" });
    const day = await createDay(event.id);

    const r1 = await POST(
      makeReq(buildPayload(guest, locA, day, { title: "A" }))
    );
    const r2 = await POST(
      makeReq(buildPayload(guest, locB, day, { title: "B" }))
    );
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);

    const sessions = await getRepositories().sessions.listByEvent(event.id);
    expect(sessions).toHaveLength(2);
  });

  it("rejects session with start time in the past", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const location = await createLocation();
    const pastDay = await createDay(event.id, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });

    const res = await POST(makeReq(buildPayload(guest, location, pastDay)));
    expect(res.ok).toBe(false);

    const sessions = await getRepositories().sessions.listByEvent(event.id);
    expect(sessions).toHaveLength(0);
  });

  it("rejects session with empty title", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const location = await createLocation();
    const day = await createDay(event.id);

    const res = await POST(
      makeReq(buildPayload(guest, location, day, { title: "" }))
    );
    expect(res.ok).toBe(false);
  });

  it("rejects session with no hosts", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const location = await createLocation();
    const day = await createDay(event.id);

    const res = await POST(
      makeReq({ ...buildPayload(guest, location, day), hosts: [] })
    );
    expect(res.ok).toBe(false);
  });

  it("rejects session with missing location id", async () => {
    const event = await createEvent();
    const guest = await createGuest();
    const location = await createLocation();
    const day = await createDay(event.id);

    const res = await POST(
      makeReq(buildPayload(guest, { ...location, id: "" }, day))
    );
    expect(res.ok).toBe(false);
  });

  // Route does not guard req.json() — parse errors surface as a thrown SyntaxError
  it("malformed JSON causes a SyntaxError", async () => {
    const req = new Request("http://test/api/add-session", {
      method: "POST",
      body: "not json",
      headers: { "content-type": "application/json" },
    });
    await expect(POST(req)).rejects.toThrow(SyntaxError);
  });
});
