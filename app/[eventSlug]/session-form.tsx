"use client";
import clsx from "clsx";
import { Fragment, useEffect, useState, useContext } from "react";
import { format } from "date-fns";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { DateTime } from "luxon";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Input } from "./input";
import {
  convertParamDateTime,
  dateOnDay,
  getEndTimeMinusBreak,
  eventNameToSlug,
  formatDuration,
  subtractBreakFromDuration,
} from "@/utils/utils";
import { MyListbox, type Option } from "./select";
import type {
  Day,
  Guest,
  Location,
  Session,
  Rsvp,
  SessionProposal,
} from "@/db/repositories/interfaces";
import { ConfirmDeletionModal } from "../modals";
import { UserContext, EventContext } from "../context";
import { sessionsOverlap, newEmptySession } from "../session_utils";
import { parseSessionTime } from "../api/session-form-utils";

interface ErrorResponse {
  message: string;
}

export function SessionForm(props: {
  eventName: string;
  days: Day[];
  sessions: Session[];
  locations: Location[];
  guests: Guest[];
  proposals: SessionProposal[];
  maxSessionDuration: number;
}) {
  const {
    eventName,
    days,
    sessions,
    locations,
    guests,
    proposals,
    maxSessionDuration,
  } = props;
  const { user: currentUser } = useContext(UserContext);
  const { event } = useContext(EventContext);
  const timezone = event?.timezone ?? "UTC";

  const searchParams = useSearchParams();
  const dayParam = searchParams?.get("day");
  const timeParam = searchParams?.get("time");
  const initLocation = searchParams?.get("location");
  const sessionID = searchParams?.get("sessionID");
  const proposalID = searchParams?.get("proposalID");
  const initialProposal = proposals.find((p) => p.id === proposalID) ?? null;
  const session =
    sessions.find((ses) => ses.id === sessionID) || newEmptySession();
  const initDateTime =
    dayParam && timeParam
      ? convertParamDateTime(dayParam, timeParam, timezone)
      : (session.startTime ?? null);
  const initDay = initDateTime
    ? days.find((d) => dateOnDay(initDateTime, d))
    : undefined;
  const initTime = initDateTime
    ? DateTime.fromJSDate(initDateTime).setZone(timezone).toFormat("h:mm a")
    : undefined;

  // Compute default hosts for new sessions (no initial proposal, no sessionID).
  // Also used as the "reset" target when the user un-selects a proposal.
  const defaultHosts: Guest[] = currentUser
    ? guests.filter((g) => g.id === currentUser)
    : [];
  const initialHosts: Guest[] = initialProposal
    ? guests.filter((g) => initialProposal.hosts.some((h) => h.id === g.id))
    : sessionID
      ? guests.filter((g) => session.hosts.some((h) => h.id === g.id))
      : defaultHosts;
  const sessionDuration = sessionID
    ? Math.round(
        ((session.endTime?.valueOf() ?? 0) -
          (session.startTime?.valueOf() ?? 0)) /
          1000 /
          60
      )
    : null;

  const [proposal, setProposal] = useState<SessionProposal | null>(
    initialProposal
  );
  const [usedProposal, setUsedProposal] = useState<boolean>(!!initialProposal);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialProposal?.title ?? session.title);
  const [description, setDescription] = useState(
    initialProposal?.description ?? session.description
  );
  const [closed, setClosed] = useState(session.closed);
  const [day, setDay] = useState(initDay ?? days[0]);
  const [locationId, setLocationId] = useState<string | undefined>(
    locations.find((l) => l.name === initLocation)?.id ??
      session.locations[0]?.id
  );
  const startTimes = getAvailableStartTimes(
    day,
    sessions,
    session,
    maxSessionDuration,
    timezone,
    locationId
  );
  const initTimeValid = startTimes.some((st) => st.formattedTime === initTime);
  const [startTime, setStartTime] = useState(
    initTimeValid ? initTime : undefined
  );
  // Derived: the currently-selected startTime if it is still available under
  // the current location/day, otherwise undefined. Avoids a setState-in-effect
  // reset by not storing invalid values downstream.
  const effectiveStartTime = startTimes.some(
    (st) => st.formattedTime === startTime && st.available
  )
    ? startTime
    : undefined;
  const maxDuration =
    startTimes.find((st) => st.formattedTime === effectiveStartTime)
      ?.maxDuration ?? maxSessionDuration;
  const [duration, setDuration] = useState<number>(
    initialProposal?.durationMinutes ??
      sessionDuration ??
      Math.min(maxDuration, 60)
  );
  // Derived: clamp duration to maxDuration. Preserves user-set value so it
  // restores when the limit widens again.
  const effectiveDuration = duration > maxDuration ? maxDuration : duration;
  const [hosts, setHosts] = useState<Guest[]>(initialHosts);

  function applyProposal(next: SessionProposal | null) {
    setProposal(next);
    if (next) {
      setTitle(next.title);
      setDescription(next.description ?? "");
      setHosts(guests.filter((g) => next.hosts.some((h) => h.id === g.id)));
      if (next.durationMinutes) {
        setDuration(next.durationMinutes);
      }
      setUsedProposal(true);
    } else if (usedProposal) {
      setTitle("");
      setDescription("");
      setHosts(defaultHosts);
    }
  }

  let dummySession = newEmptySession();
  if (effectiveStartTime && day) {
    const { start, end } = parseSessionTime(
      day,
      effectiveStartTime,
      effectiveDuration,
      timezone
    );
    dummySession = {
      ...newEmptySession(),
      startTime: new Date(start),
      endTime: new Date(end),
      id: sessionID || "",
    };
  }

  const [hostRSVPs, setHostRSVPs] = useState<Record<string, Rsvp[]>>({});
  const [isFetchingRSVPs, setIsFetchingRSVPs] = useState(false);

  useEffect(() => {
    const fetchRSVPs = async () => {
      setIsFetchingRSVPs(true);
      const entries = await Promise.all(
        hosts.map(async (host) => {
          const res = await fetch(`/api/rsvps?user=${host.id}`);
          const rsvps = (await res.json()) as Rsvp[];
          return [host.id, rsvps] as const;
        })
      );

      setHostRSVPs(Object.fromEntries(entries));
      setIsFetchingRSVPs(false);
    };

    void fetchRSVPs();
  }, [hosts]);

  const clashes = hosts.map((host) => {
    const sessionClashes = sessions.filter(
      (ses) =>
        ses.hosts.some((h) => h.id === host.id) &&
        sessionsOverlap(ses, dummySession)
    );
    const rsvpClashes = (hostRSVPs[host.id] || [])
      .map((rsvp) => sessions.find((ses) => ses.id === rsvp.sessionId))
      .filter((ses): ses is Session => ses !== undefined)
      .filter((ses) => sessionsOverlap(ses, dummySession));

    return {
      id: host.id,
      sessionClashes,
      rsvpClashes,
    };
  });
  const clashErrors = clashes
    .map((hostClashes) => {
      const { id, sessionClashes, rsvpClashes } = hostClashes;
      const hostName = hosts.find((host) => host.id === id)!.name;
      const formatTime = (d: DateTime) => d.setZone(timezone).toFormat("HH:mm");
      const displayInterval = (ses: Session) =>
        `from ${formatTime(DateTime.fromJSDate(ses.startTime ?? new Date()))} to ${formatTime(getEndTimeMinusBreak(ses))}`;
      const sessionErrors = sessionClashes.map(
        (ses) => `${hostName} is hosting ${ses.title} ${displayInterval(ses)}`
      );
      const rsvpErrors = rsvpClashes.map(
        (ses) => `${hostName} is attending ${ses.title} ${displayInterval(ses)}`
      );
      return sessionErrors.concat(rsvpErrors);
    })
    .flat();

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const Submit = async () => {
    setIsSubmitting(true);
    setError(null);
    const location = locations.find((loc) => loc.id === locationId);
    if (!location || !day || !effectiveStartTime) {
      setError("Missing required fields");
      setIsSubmitting(false);
      return;
    }
    const endpoint = sessionID ? "/api/update-session" : "/api/add-session";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: sessionID,
        title,
        description,
        closed,
        day,
        location,
        startTimeString: effectiveStartTime,
        duration: effectiveDuration,
        hosts,
        proposal: proposal?.id ?? session.proposalId,
        timezone,
      }),
    });
    if (res.ok) {
      const actionType = sessionID ? "updated" : "added";
      router.push(
        `/${eventNameToSlug(eventName)}/add-session/confirmation?actionType=${actionType}`
      );
      console.log(`Session ${actionType} successfully`);
    } else {
      let errorMessage = "Failed to update session";
      try {
        const errorData = (await res.json()) as ErrorResponse;
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = res.statusText || `Server error (${res.status})`;
      }
      setError(errorMessage);
      console.error("Error updating session:", {
        status: res.status,
        statusText: res.statusText,
      });
    }
    setIsSubmitting(false);
  };
  const Delete = async () => {
    setError(null);
    setIsSubmitting(true);
    const res = await fetch("/api/delete-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: sessionID,
      }),
    });
    if (res.ok) {
      console.log("Session deleted successfully");
      router.push(
        `/${eventNameToSlug(eventName)}/edit-session/deletion-confirmation`
      );
    } else {
      let errorMessage = "Failed to delete session";
      try {
        const errorData = (await res.json()) as ErrorResponse;
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = res.statusText || `Server error (${res.status})`;
      }
      setError(errorMessage);
      console.error("Error deleting session:", {
        status: res.status,
        statusText: res.statusText,
      });
    }
    setIsSubmitting(false);
  };

  const nullProposalOpts: Option[] = [
    {
      value: "",
      display: "[none]",
      available: true,
    },
  ];
  const proposalSelectOpts = nullProposalOpts.concat(
    proposals.map((pr) => ({
      value: pr.id,
      display: pr.title,
      available: true,
    }))
  );

  return (
    <div className="flex flex-col gap-4">
      <Link
        className="bg-rose-400 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 w-fit px-12"
        href={`/${eventNameToSlug(eventName)}`}
      >
        Back to schedule
      </Link>
      <div>
        <h2 className="text-2xl font-bold">
          {eventName}: {sessionID ? "Edit" : "Add a"} session
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {sessionID
            ? ""
            : "Fill out this form to add a session to the schedule! "}
          Your session will be added to the schedule immediately, but we may
          reach out to you about rescheduling, relocating, or cancelling.
        </p>
      </div>
      {proposals.length > 0 && !sessionID && (
        <div className="flex flex-col gap-1 w-72">
          <label className="font-medium">Proposal</label>
          <MyListbox
            currValue={proposal?.id ?? ""}
            setCurrValue={(id) =>
              applyProposal(proposals.find((p) => p.id === id) ?? null)
            }
            options={proposalSelectOpts}
            placeholder={"Pre-fill from proposal"}
            truncateText={false}
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="font-medium">
          Session title
          <RequiredStar />
        </label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium">Description</label>
        <textarea
          value={description}
          className="rounded-md text-sm resize-none h-24 border bg-white px-4 shadow-sm transition-colors invalid:border-red-500 invalid:text-red-900 invalid:placeholder-red-300 focus:outline-none disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 border-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:outline-0 focus:border-none"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Closed session checkbox */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={closed}
            onChange={(e) => setClosed(e.target.checked)}
            className="h-4 w-4 text-rose-400 focus:ring-rose-400 border-gray-300 rounded"
          />
          Closed session
        </label>
        <p className="text-sm text-gray-500 ml-6">
          Check this if participants can at most arrive 5 minutes late. If they
          arrive later they may not join and should not knock or otherwise
          disrupt the session.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-medium">
          Hosts
          <RequiredStar />
        </label>
        <p className="text-sm text-gray-500">
          You and any cohosts who have agreed to host this session with you. All
          hosts will get an email confirmation when this form is submitted.
        </p>
        <SelectHosts
          guests={guests}
          hosts={hosts}
          setHosts={setHosts}
          selectMany={true}
        />
      </div>
      <div className="flex flex-col gap-1 w-72">
        <label className="font-medium">
          Location
          <RequiredStar />
        </label>
        <MyListbox
          currValue={locationId}
          setCurrValue={setLocationId}
          options={locations.map((loc) => ({
            value: loc.id,
            display: loc.name,
            available: true,
            helperText: `max ${loc.capacity}`,
          }))}
          placeholder={"Select a location"}
          truncateText={true}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium">
          Day
          <RequiredStar />
        </label>
        <SelectDay days={days} day={day} setDay={setDay} />
      </div>
      <div className="flex flex-col gap-1 w-72">
        <label className="font-medium">
          Start Time
          <RequiredStar />
        </label>
        <MyListbox
          currValue={effectiveStartTime}
          setCurrValue={setStartTime}
          options={startTimes.map((st) => {
            return { value: st.formattedTime, available: st.available };
          })}
          placeholder={"Select a start time"}
          truncateText={true}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium">
          Duration
          <RequiredStar />
        </label>
        <SelectDuration
          duration={effectiveDuration}
          setDuration={setDuration}
          maxDuration={maxDuration}
        />
      </div>
      {sessionID && session.proposalId && (
        <p className="text-sm text-gray-600">
          This session was scheduled from a proposal. See it{" "}
          <a
            href={`/${eventNameToSlug(eventName)}/proposals/${session.proposalId}/view`}
            className="text-rose-500 underline hover:text-rose-600 transition-colors"
          >
            here
          </a>
          .
        </p>
      )}
      {clashErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm font-medium">Warning: schedule clash</p>
          {clashErrors.map((error) => (
            <p key={error} className="text-sm font-medium">
              - {error}
            </p>
          ))}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm font-medium">Error: {error}</p>
        </div>
      )}
      <button
        type="submit"
        className="bg-rose-400 text-white font-semibold py-2 rounded shadow disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none hover:bg-rose-500 active:bg-rose-500 mx-auto px-12"
        disabled={
          !title ||
          !effectiveStartTime ||
          !hosts.length ||
          !locationId ||
          !day ||
          !effectiveDuration ||
          isFetchingRSVPs ||
          isSubmitting
        }
        onClick={() => void Submit()}
      >
        Submit
      </button>
      {sessionID && (
        <ConfirmDeletionModal
          btnDisabled={isSubmitting}
          confirm={Delete}
          itemName="session"
        />
      )}
    </div>
  );
}

const RequiredStar = () => <span className="text-rose-500 mx-1">*</span>;

type StartTime = {
  formattedTime: string;
  time: number;
  maxDuration: number;
  available: boolean;
};
function getAvailableStartTimes(
  day: Day,
  sessions: Session[],
  currentSession: Session,
  maxSessionDuration: number,
  timezone: string,
  locationId?: string
) {
  const locationSelected = !!locationId;
  const filteredSessions = (
    locationSelected
      ? sessions.filter(
          (s) =>
            s.locations.some((l) => l.id === locationId) &&
            s.id !== currentSession.id
        )
      : sessions
  ).filter((s) => (s.startTime?.getTime() ?? 0) < day.end.getTime());
  const sortedSessions = filteredSessions.sort(
    (a, b) => (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0)
  );
  const startTimes: StartTime[] = [];
  for (
    let t = day.startBookings.getTime();
    t < day.endBookings.getTime();
    t += 30 * 60 * 1000
  ) {
    const formattedTime = DateTime.fromMillis(t)
      .setZone(timezone)
      .toFormat("h:mm a");
    if (locationSelected) {
      const sessionNow = sortedSessions.find(
        (session) =>
          (session.startTime?.getTime() ?? 0) <= t &&
          (session.endTime?.getTime() ?? 0) > t
      );
      if (sessionNow) {
        startTimes.push({
          formattedTime,
          time: t,
          maxDuration: 0,
          available: false,
        });
      } else {
        const nextSession = sortedSessions.find(
          (session) => (session.startTime?.getTime() ?? 0) > t
        );
        const latestEndTime = nextSession
          ? nextSession.startTime!.getTime()
          : day.endBookings.getTime();
        startTimes.push({
          formattedTime,
          time: t,
          maxDuration: Math.min(
            (latestEndTime - t) / 1000 / 60,
            maxSessionDuration
          ),
          available: true,
        });
      }
    } else {
      startTimes.push({
        formattedTime,
        time: t,
        maxDuration: maxSessionDuration,
        available: true,
      });
    }
  }
  return startTimes;
}

export function SelectHosts(props: {
  guests: Guest[];
  hosts: Guest[];
  setHosts: (hosts: Guest[]) => void;
  id?: string;
  selectMany: boolean;
}) {
  const { guests, hosts, setHosts, id, selectMany } = props;
  const [query, setQuery] = useState("");
  const filteredGuests = guests
    .filter((guest) => guest.name.toLowerCase().includes(query.toLowerCase()))
    .filter((guest) => guest.name.trim().length > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 20);

  const comboboxContent = (
    <div className="relative mt-1">
      <div className="relative w-full min-h-12 h-fit rounded-md border transition-colors border-gray-300 bg-white py-2 pl-3 pr-10 focus-within:ring-2 focus-within:ring-rose-400 focus-within:border-transparent">
        <div className="flex flex-wrap gap-1 items-center">
          {hosts.length > 0 && (
            <>
              {hosts.map((host) => (
                <span
                  key={host.id}
                  className="py-1 px-2 bg-gray-100 rounded text-nowrap text-sm flex items-center gap-1"
                >
                  {host.name}
                  <span
                    onClick={(e) => {
                      setHosts(hosts.filter((h) => h !== host));
                      e.stopPropagation();
                    }}
                    role="button"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-700" />
                  </span>
                </span>
              ))}
            </>
          )}
          <Combobox.Input
            id={id}
            onChange={(event) => setQuery(event.target.value)}
            value={query}
            className="border-none focus:ring-0 px-0 py-1 text-sm flex-1 min-w-8 bg-transparent placeholder:text-gray-400 outline-none"
          />
        </div>
      </div>
      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
      </Combobox.Button>
      <Transition
        as={Fragment}
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        afterLeave={() => setQuery("")}
      >
        <Combobox.Options className="absolute mt-1 max-h-60 z-10 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
          {filteredGuests.length === 0 && query !== "" ? (
            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
              Nothing found.
            </div>
          ) : (
            filteredGuests.map((guest) => (
              <Combobox.Option
                key={guest.id}
                className={({ active }) =>
                  clsx(
                    "relative cursor-pointer select-none py-2 pl-10 pr-4 z-10",
                    active
                      ? "bg-rose-100 text-rose-900"
                      : "text-gray-900 bg-white"
                  )
                }
                value={guest}
              >
                {({ selected, disabled }) => (
                  <>
                    <span
                      className={clsx(
                        "block truncate",
                        selected ? "font-medium" : "font-normal",
                        disabled ? "text-gray-400" : "text-gray-900"
                      )}
                    >
                      {guest.name}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-rose-400">
                        <CheckIcon className="h-5 w-5" />
                      </span>
                    ) : null}
                  </>
                )}
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </Transition>
    </div>
  );
  return (
    <div className="w-full">
      {selectMany ? (
        <Combobox
          value={hosts}
          onChange={(newHosts) => {
            setHosts(newHosts);
            setQuery("");
          }}
          multiple
          immediate
        >
          {comboboxContent}
        </Combobox>
      ) : (
        <Combobox
          value={hosts[0] ?? null}
          onChange={(newHosts) => {
            setHosts(newHosts ? [newHosts] : []);
            setQuery("");
          }}
          immediate
        >
          {comboboxContent}
        </Combobox>
      )}
    </div>
  );
}

function SelectDuration(props: {
  duration: number;
  setDuration: (duration: number) => void;
  maxDuration?: number;
}) {
  const { duration, setDuration, maxDuration } = props;
  const limit = maxDuration ?? 180;
  const availableDurations = Array.from(
    { length: Math.floor(limit / 30) },
    (_, i) => (i + 1) * 30
  );
  return (
    <fieldset>
      <div className="space-y-4">
        {availableDurations.map((value) => (
          <div key={value} className="flex items-center">
            <input
              id={`duration-${value}`}
              type="radio"
              checked={value === duration}
              onChange={() => setDuration(value)}
              className="h-4 w-4 border-gray-300 text-rose-400 focus:ring-rose-400"
            />
            <label
              htmlFor={`duration-${value}`}
              className="ml-3 block text-sm font-medium leading-6 text-gray-900"
            >
              {formatDuration(subtractBreakFromDuration(value), true)}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function SelectDay(props: {
  days: Day[];
  day: Day;
  setDay: (day: Day) => void;
}) {
  const { days, day, setDay } = props;
  return (
    <fieldset>
      <div className="space-y-4">
        {days.map((d) => {
          const formattedDay = format(d.start, "EEEE, MMMM d");
          return (
            <div key={d.id} className="flex items-center">
              <input
                id={d.id}
                type="radio"
                checked={d.id === day.id}
                onChange={() => setDay(d)}
                className="h-4 w-4 border-gray-300 text-rose-400 focus:ring-rose-400"
              />
              <label
                htmlFor={d.id}
                className="ml-3 block text-sm font-medium leading-6 text-gray-900"
              >
                {formattedDay}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
