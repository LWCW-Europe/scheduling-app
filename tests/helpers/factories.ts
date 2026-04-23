import { getRepositories } from "@/db/container";
import type {
  Event,
  Guest,
  Location,
  Day,
  Session,
  SessionProposal,
} from "@/db/repositories/interfaces";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function createEvent(opts?: {
  phase?: "proposal" | "voting" | "scheduling";
  name?: string;
}): Promise<Event> {
  const { events } = getRepositories();
  const now = new Date();
  const phase = opts?.phase ?? "proposal";

  let proposalPhaseStart: Date,
    proposalPhaseEnd: Date,
    votingPhaseStart: Date,
    votingPhaseEnd: Date,
    schedulingPhaseStart: Date,
    schedulingPhaseEnd: Date;

  if (phase === "proposal") {
    proposalPhaseStart = new Date(now.getTime() - 7 * DAY_MS);
    proposalPhaseEnd = new Date(now.getTime() + 7 * DAY_MS);
    votingPhaseStart = proposalPhaseEnd;
    votingPhaseEnd = new Date(votingPhaseStart.getTime() + 14 * DAY_MS);
    schedulingPhaseStart = votingPhaseEnd;
    schedulingPhaseEnd = new Date(schedulingPhaseStart.getTime() + 14 * DAY_MS);
  } else if (phase === "voting") {
    votingPhaseStart = new Date(now.getTime() - 7 * DAY_MS);
    votingPhaseEnd = new Date(now.getTime() + 7 * DAY_MS);
    proposalPhaseStart = new Date(votingPhaseStart.getTime() - 14 * DAY_MS);
    proposalPhaseEnd = votingPhaseStart;
    schedulingPhaseStart = votingPhaseEnd;
    schedulingPhaseEnd = new Date(schedulingPhaseStart.getTime() + 14 * DAY_MS);
  } else {
    schedulingPhaseStart = new Date(now.getTime() - 7 * DAY_MS);
    schedulingPhaseEnd = new Date(now.getTime() + 7 * DAY_MS);
    votingPhaseStart = new Date(schedulingPhaseStart.getTime() - 14 * DAY_MS);
    votingPhaseEnd = schedulingPhaseStart;
    proposalPhaseStart = new Date(votingPhaseStart.getTime() - 14 * DAY_MS);
    proposalPhaseEnd = votingPhaseStart;
  }

  const start = new Date(schedulingPhaseEnd.getTime() + 7 * DAY_MS);
  const end = new Date(start.getTime() + 2 * DAY_MS);

  return events.create({
    name: opts?.name ?? `Test Event ${Date.now()}`,
    description: "",
    website: "",
    start,
    end,
    proposalPhaseStart,
    proposalPhaseEnd,
    votingPhaseStart,
    votingPhaseEnd,
    schedulingPhaseStart,
    schedulingPhaseEnd,
    maxSessionDuration: 120,
  });
}

export async function createGuest(opts?: {
  name?: string;
  email?: string;
}): Promise<Guest> {
  const { guests } = getRepositories();
  const unique = Date.now();
  return guests.create({
    name: opts?.name ?? `Test Guest ${unique}`,
    email: opts?.email ?? `guest-${unique}@test.example`,
  });
}

export async function createLocation(opts?: {
  name?: string;
  capacity?: number;
  bookable?: boolean;
}): Promise<Location> {
  const { locations } = getRepositories();
  return locations.create({
    name: opts?.name ?? `Test Room ${Date.now()}`,
    imageUrl: "",
    description: "",
    capacity: opts?.capacity ?? 30,
    color: "#3b82f6",
    hidden: false,
    bookable: opts?.bookable ?? true,
    sortIndex: 0,
  });
}

export async function createDay(
  eventId: string,
  opts?: { start?: Date; end?: Date }
): Promise<Day> {
  const { days } = getRepositories();
  const base =
    opts?.start ??
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      d.setHours(8, 0, 0, 0);
      return d;
    })();
  const end = opts?.end ?? new Date(new Date(base).setHours(18, 0, 0, 0));
  const startBookings = new Date(new Date(base).setHours(9, 0, 0, 0));
  const endBookings = new Date(new Date(base).setHours(17, 0, 0, 0));
  return days.create({ start: base, end, startBookings, endBookings, eventId });
}

export async function createProposal(
  eventId: string,
  hostIds: string[],
  opts?: { title?: string; description?: string; durationMinutes?: number }
): Promise<SessionProposal> {
  const { sessionProposals } = getRepositories();
  return sessionProposals.create({
    eventId,
    title: opts?.title ?? `Test Proposal ${Date.now()}`,
    description: opts?.description,
    hostIds,
    durationMinutes: opts?.durationMinutes,
  });
}

export async function createSession(
  eventId: string,
  opts?: {
    title?: string;
    locationIds?: string[];
    hostIds?: string[];
    startTime?: Date;
    endTime?: Date;
    capacity?: number;
  }
): Promise<Session> {
  const { sessions } = getRepositories();
  return sessions.create({
    title: opts?.title ?? `Test Session ${Date.now()}`,
    description: "",
    startTime: opts?.startTime,
    endTime: opts?.endTime,
    capacity: opts?.capacity ?? 30,
    attendeeScheduled: true,
    blocker: false,
    closed: false,
    eventId,
    hostIds: opts?.hostIds ?? [],
    locationIds: opts?.locationIds ?? [],
  });
}
