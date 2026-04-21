// ── Shared enums ─────────────────────────────────────────────────────────────

export enum VoteChoice {
  interested = "interested",
  maybe = "maybe",
  skip = "skip",
}

// ── Days ─────────────────────────────────────────────────────────────────────

export type Day = {
  id: string;
  start: Date;
  end: Date;
  startBookings: Date;
  endBookings: Date;
  eventId?: string;
};

export interface DaysRepository {
  list(): Promise<Day[]>;
  listByEvent(eventId: string): Promise<Day[]>;
  findById(id: string): Promise<Day | undefined>;
  create(data: Omit<Day, "id">): Promise<Day>;
}

// ── Events ────────────────────────────────────────────────────────────────────

export type Event = {
  id: string;
  name: string;
  description: string;
  website: string;
  start: Date;
  end: Date;
  proposalPhaseStart?: Date;
  proposalPhaseEnd?: Date;
  votingPhaseStart?: Date;
  votingPhaseEnd?: Date;
  schedulingPhaseStart?: Date;
  schedulingPhaseEnd?: Date;
  maxSessionDuration: number;
};

export interface EventsRepository {
  list(): Promise<Event[]>;
  findById(id: string): Promise<Event | undefined>;
  findByName(name: string): Promise<Event | undefined>;
  create(data: Omit<Event, "id">): Promise<Event>;
}

// ── Guests ────────────────────────────────────────────────────────────────────

export type Guest = {
  id: string;
  name: string;
  email: string;
};

export interface GuestsRepository {
  list(): Promise<Guest[]>;
  listByEvent(eventId: string): Promise<Guest[]>;
  findById(id: string): Promise<Guest | undefined>;
  findByEmail(email: string): Promise<Guest | undefined>;
  create(data: Omit<Guest, "id">): Promise<Guest>;
}

// ── Locations ─────────────────────────────────────────────────────────────────

export type Location = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  capacity: number;
  color: string;
  hidden: boolean;
  bookable: boolean;
  sortIndex: number;
  areaDescription?: string;
};

export interface LocationsRepository {
  listVisible(): Promise<Location[]>;
  listBookable(): Promise<Location[]>;
  findById(id: string): Promise<Location | undefined>;
  create(data: Omit<Location, "id">): Promise<Location>;
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export type SessionHost = Pick<Guest, "id" | "name" | "email">;
export type SessionLocation = Pick<Location, "id" | "name" | "color">;

export type Session = {
  id: string;
  title: string;
  description: string;
  startTime?: Date;
  endTime?: Date;
  capacity: number;
  attendeeScheduled: boolean;
  blocker: boolean;
  closed: boolean;
  proposalId?: string;
  eventId?: string;
  hosts: SessionHost[];
  locations: SessionLocation[];
  numRsvps: number;
};

export type SessionCreateInput = {
  title: string;
  description: string;
  startTime?: Date;
  endTime?: Date;
  capacity: number;
  attendeeScheduled: boolean;
  blocker: boolean;
  closed: boolean;
  proposalId?: string;
  eventId?: string;
  hostIds: string[];
  locationIds: string[];
};

export type SessionUpdateInput = Partial<
  Omit<SessionCreateInput, "hostIds" | "locationIds">
> & {
  hostIds?: string[];
  locationIds?: string[];
};

export interface SessionsRepository {
  list(): Promise<Session[]>;
  listScheduled(): Promise<Session[]>;
  listByEvent(eventId: string): Promise<Session[]>;
  listScheduledByEvent(eventId: string): Promise<Session[]>;
  findById(id: string): Promise<Session | undefined>;
  create(data: SessionCreateInput): Promise<Session>;
  update(id: string, patch: SessionUpdateInput): Promise<Session>;
  delete(id: string): Promise<void>;
}

// ── RSVPs ─────────────────────────────────────────────────────────────────────

export type Rsvp = {
  id: string;
  sessionId: string;
  guestId: string;
};

export interface RsvpsRepository {
  listByGuest(guestId: string): Promise<Rsvp[]>;
  listBySession(sessionId: string): Promise<Rsvp[]>;
  create(data: { sessionId: string; guestId: string }): Promise<Rsvp>;
  deleteBySessionAndGuest(sessionId: string, guestId: string): Promise<void>;
  deleteBySessionAndGuests(
    sessionId: string,
    guestIds: string[]
  ): Promise<void>;
}

// ── Session Proposals ─────────────────────────────────────────────────────────

export type ProposalHost = Pick<Guest, "id" | "name" | "email">;

export type SessionProposal = {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  createdTime: Date;
  hosts: ProposalHost[];
  votesCount: number;
  interestedVotesCount: number;
  maybeVotesCount: number;
  sessionIds: string[];
};

export type SessionProposalCreateInput = {
  eventId: string;
  title: string;
  description?: string;
  hostIds: string[];
  durationMinutes?: number;
};

export type SessionProposalUpdateInput = {
  title?: string;
  description?: string;
  hostIds?: string[];
  durationMinutes?: number | null;
};

export interface SessionProposalsRepository {
  listByEvent(eventId: string): Promise<SessionProposal[]>;
  findById(id: string): Promise<SessionProposal | undefined>;
  create(data: SessionProposalCreateInput): Promise<SessionProposal>;
  update(
    id: string,
    patch: SessionProposalUpdateInput
  ): Promise<SessionProposal>;
  delete(id: string): Promise<void>;
}

// ── Votes ─────────────────────────────────────────────────────────────────────

export type Vote = {
  id: string;
  proposalId: string;
  guestId: string;
  choice: VoteChoice;
};

export interface VotesRepository {
  listByGuestAndEvent(guestId: string, eventId: string): Promise<Vote[]>;
  create(data: {
    proposalId: string;
    guestId: string;
    choice: VoteChoice;
  }): Promise<Vote>;
  deleteByGuestAndProposal(guestId: string, proposalId: string): Promise<void>;
  deleteByProposal(proposalId: string): Promise<void>;
  deleteByProposalAndGuests(
    proposalId: string,
    guestIds: string[]
  ): Promise<void>;
}
