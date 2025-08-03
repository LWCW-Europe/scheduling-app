import type { Event } from "@/db/events";

/**
 * Represents the different phases an event can be in
 */
export enum EventPhase {
  PROPOSAL = "proposal",
  VOTING = "voting",
  SCHEDULING = "scheduling",
  INACTIVE = "inactive",
}

/**
 * Checks if the current time falls within a date period
 * @param start - The start date of the period
 * @param end - The end date of the period (optional, defaults to no end limit)
 * @returns true if current time is within the period
 */
function inDatePeriod(start: Date, end?: Date): boolean {
  const now = Date.now();
  const afterStart = now >= start.getTime();
  const beforeEnd = !end || now <= end.getTime();
  return afterStart && beforeEnd;
}

/**
 * Checks if an event is currently in the proposal phase
 * @param event - The event to check
 * @returns true if the event is in the proposal phase
 */
export function inProposalPhase(event: Event): boolean {
  const { proposalPhaseStart, proposalPhaseEnd } = event;
  return !!(
    proposalPhaseStart && inDatePeriod(proposalPhaseStart, proposalPhaseEnd)
  );
}

/**
 * Checks if an event is currently in the voting phase
 * @param event - The event to check
 * @returns true if the event is in the voting phase
 */
export function inVotingPhase(event: Event): boolean {
  const { votingPhaseStart, votingPhaseEnd } = event;
  return !!(votingPhaseStart && inDatePeriod(votingPhaseStart, votingPhaseEnd));
}

/**
 * Checks if an event is currently in the scheduling phase
 * @param event - The event to check
 * @returns true if the event is in the scheduling phase
 */
export function inSchedPhase(event: Event): boolean {
  const { schedulingPhaseStart, schedulingPhaseEnd } = event;

  // If no phases are configured, assume scheduling is always active
  if (!hasPhases(event)) {
    return true;
  }

  return !!(
    schedulingPhaseStart &&
    inDatePeriod(schedulingPhaseStart, schedulingPhaseEnd)
  );
}

/**
 * Gets the current phase of an event
 * @param event - The event to check
 * @returns The current phase of the event
 */
export function getCurrentPhase(event: Event): EventPhase {
  if (inProposalPhase(event)) return EventPhase.PROPOSAL;
  if (inVotingPhase(event)) return EventPhase.VOTING;
  if (inSchedPhase(event)) return EventPhase.SCHEDULING;
  return EventPhase.INACTIVE;
}

/**
 * Checks if an event has any phases configured
 * @param event - The event to check
 * @returns true if the event has at least one phase configured
 */
export function hasPhases(event: Event): boolean {
  const { proposalPhaseStart, votingPhaseStart, schedulingPhaseStart } = event;

  return !!(proposalPhaseStart || votingPhaseStart || schedulingPhaseStart);
}

export function dateStartDescription(date?: Date): string {
  if (date) {
    const dateText = date.toLocaleString("en-GB", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return "will be enabled on " + dateText;
  } else {
    return "is not enabled";
  }
}
