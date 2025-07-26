"use client";
import clsx from "clsx";
import { Fragment, useEffect, useState, useContext } from "react";
import { Input } from "./input";
import { format } from "date-fns";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { DateTime } from "luxon";
import { useRouter, useSearchParams } from "next/navigation";
import { convertParamDateTime, dateOnDay } from "@/utils/utils";
import { MyListbox } from "./select";
import { Day } from "@/db/days";
import { Guest } from "@/db/guests";
import { Location } from "@/db/locations";
import { Session } from "@/db/sessions";
import { ConfirmDeletionModal } from "../modals";
import { UserContext } from "../context";

interface ErrorResponse {
  message: string;
}

export function SessionForm(props: {
  eventName: string;
  days: Day[];
  sessions: Session[];
  locations: Location[];
  guests: Guest[];
}) {
  const { eventName, days, sessions, locations, guests } = props;
  const searchParams = useSearchParams();
  const dayParam = searchParams?.get("day");
  const timeParam = searchParams?.get("time");
  const initLocation = searchParams?.get("location");
  const sessionID = searchParams?.get("sessionID");
  const emptySession: Session = {
    ID: "",
    Title: "",
    Description: "",
    "Start time": "",
    "End time": "",
    Hosts: [],
    Location: [],
    "Location name": [],
    Capacity: 0,
    "Num RSVPs": 0,
  };
  const session = sessions.find((ses) => ses.ID === sessionID) || emptySession;
  const initDateTime =
    dayParam && timeParam
      ? convertParamDateTime(dayParam, timeParam)
      : new Date(session["Start time"]);
  const initDay = initDateTime
    ? days.find((d) => dateOnDay(initDateTime, d))
    : undefined;
  const initTime = initDateTime
    ? DateTime.fromJSDate(initDateTime)
        .setZone("America/Los_Angeles")
        .toFormat("h:mm a")
    : undefined;

  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(session.Title);
  const [description, setDescription] = useState(session.Description);
  const [day, setDay] = useState(initDay ?? days[0]);
  const [location, setLocation] = useState(
    locations.find((l) => l.Name === initLocation)?.Name ??
      session["Location name"][0]
  );
  const startTimes = getAvailableStartTimes(day, sessions, session, location);
  const initTimeValid = startTimes.some((st) => st.formattedTime === initTime);
  const [startTime, setStartTime] = useState(
    initTimeValid ? initTime : undefined
  );
  const maxDuration = startTimes.find(
    (st) => st.formattedTime === startTime
  )?.maxDuration;
  const [duration, setDuration] = useState(Math.min(maxDuration ?? 60, 60));
  const { user: currentUser } = useContext(UserContext);
  let initialHosts: Guest[] = [];
  if (!sessionID) {
    initialHosts = guests.filter((g) => g.ID == currentUser);
  }
  const [hosts, setHosts] = useState<Guest[]>(initialHosts);
  useEffect(() => {
    if (sessionID) {
      setHosts(guests.filter((g) => session.Hosts?.includes(g.ID)));
      const endTime = new Date(session["End time"]).valueOf();
      const startTime = new Date(session["Start time"]).valueOf();
      const duration = Math.round((endTime - startTime) / 1000 / 60);
      setDuration(duration);
    }
  }, [guests, session, sessionID]);
  useEffect(() => {
    if (
      !startTimes.some((st) => st.formattedTime === startTime && st.available)
    ) {
      setStartTime(undefined);
    }
    if (maxDuration && duration > maxDuration) {
      setDuration(maxDuration);
    }
  }, [startTime, maxDuration, duration, startTimes]);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const Submit = async () => {
    setIsSubmitting(true);
    setError(null);
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
        day: day,
        location: locations.find((loc) => loc.Name === location),
        startTimeString: startTime,
        duration,
        hosts: hosts,
      }),
    });
    if (res.ok) {
      const actionType = sessionID ? "updated" : "added";
      router.push(
        `/${eventName.replace(
          / /g,
          "-"
        )}/add-session/confirmation?actionType=${actionType}`
      );
      console.log(`Session ${actionType} successfully`);
    } else {
      let errorMessage = "Failed to update session";
      try {
        const errorData = (await res.json()) as ErrorResponse;
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Response is not valid JSON, use status text or generic message
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
        `/${eventName.replace(/ /g, "-")}/edit-session/deletion-confirmation`
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
  return (
    <div className="flex flex-col gap-4">
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
      <div className="flex flex-col gap-1">
        <label className="font-medium">
          Hosts
          <RequiredStar />
        </label>
        <p className="text-sm text-gray-500">
          You and any cohosts who have agreed to host this session with you. All
          hosts will get an email confirmation when this form is submitted.
        </p>
        <SelectHosts guests={guests} hosts={hosts} setHosts={setHosts} />
      </div>
      <div className="flex flex-col gap-1 w-72">
        <label className="font-medium">
          Location
          <RequiredStar />
        </label>
        <MyListbox
          currValue={location}
          setCurrValue={setLocation}
          options={locations.map((loc) => {
            return {
              value: loc.Name,
              available: true,
              helperText: `max ${loc.Capacity}`,
            };
          })}
          placeholder={"Select a location"}
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
          currValue={startTime}
          setCurrValue={setStartTime}
          options={startTimes.map((st) => {
            return { value: st.formattedTime, available: st.available };
          })}
          placeholder={"Select a start time"}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-medium">
          Duration
          <RequiredStar />
        </label>
        <SelectDuration
          duration={duration}
          setDuration={setDuration}
          maxDuration={maxDuration}
        />
      </div>
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
          !startTime ||
          !hosts.length ||
          !location ||
          !day ||
          !duration ||
          !duration ||
          isSubmitting
        }
        onClick={() => void Submit()}
      >
        Submit
      </button>
      {sessionID && (
        <ConfirmDeletionModal btnDisabled={isSubmitting} confirm={Delete} />
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
  location?: string
) {
  const locationSelected = !!location;
  const filteredSessions = locationSelected
    ? sessions.filter(
        (s) => s["Location name"][0] === location && s.ID != currentSession.ID
      )
    : sessions;
  const sortedSessions = filteredSessions.sort(
    (a, b) =>
      new Date(a["Start time"]).getTime() - new Date(b["Start time"]).getTime()
  );
  const startTimes: StartTime[] = [];
  for (
    let t = day.StartBookings.getTime();
    t < day.EndBookings.getTime();
    t += 30 * 60 * 1000
  ) {
    const formattedTime = DateTime.fromMillis(t)
      .setZone("America/Los_Angeles")
      .toFormat("h:mm a");
    if (locationSelected) {
      const sessionNow = sortedSessions.find(
        (session) =>
          new Date(session["Start time"]).getTime() <= t &&
          new Date(session["End time"]).getTime() > t
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
          (session) => new Date(session["Start time"]).getTime() > t
        );
        const latestEndTime = nextSession
          ? new Date(nextSession["Start time"]).getTime()
          : day.EndBookings.getTime();
        startTimes.push({
          formattedTime,
          time: t,
          maxDuration: (latestEndTime - t) / 1000 / 60,
          available: true,
        });
      }
    } else {
      startTimes.push({
        formattedTime,
        time: t,
        maxDuration: 120,
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
}) {
  const { guests, hosts, setHosts } = props;
  const [query, setQuery] = useState("");
  const filteredGuests = guests
    .filter((guest) =>
      guest["Name"].toLowerCase().includes(query.toLowerCase())
    )
    .filter((guest) => guest["Name"].trim().length > 0)
    .sort((a, b) => a["Name"].localeCompare(b["Name"]))
    .slice(0, 20);
  return (
    <div className="w-full">
      <Combobox
        value={hosts}
        onChange={(newHosts) => {
          setHosts(newHosts);
          setQuery("");
        }}
        multiple
      >
        <div className="relative mt-1">
          <Combobox.Button className="relative w-full min-h-12 h-fit rounded-md border px-4 shadow-sm transition-colors focus:outline-none border-gray-300 focus:ring-2 focus:ring-rose-400 focus:outline-0 focus:border-none bg-white py-2 pl-3 pr-10 text-left placeholder:text-gray-400">
            <div className="flex flex-wrap gap-1 items-center">
              {hosts.length > 0 && (
                <>
                  {hosts.map((host) => (
                    <span
                      key={host.ID}
                      className="py-1 px-2 bg-gray-100 rounded text-nowrap text-sm flex items-center gap-1"
                    >
                      {host.Name}
                      <button
                        onClick={() =>
                          setHosts(hosts.filter((h) => h !== host))
                        }
                      >
                        <XMarkIcon className="h-3 w-3 text-gray-400" />
                      </button>
                    </span>
                  ))}
                </>
              )}
              <Combobox.Input
                onChange={(event) => setQuery(event.target.value)}
                value={query}
                className="border-none focus:ring-0 px-0 py-1 text-sm focus:w-fit w-0 placeholder:text-gray-400"
              />
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </div>
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
                    key={guest["ID"]}
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
                          {guest.Name}
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
      </Combobox>
    </div>
  );
}

function SelectDuration(props: {
  duration: number;
  setDuration: (duration: number) => void;
  maxDuration?: number;
}) {
  const { duration, setDuration, maxDuration } = props;
  const durations = [
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];
  const availableDurations = maxDuration
    ? durations.filter(({ value }) => value <= maxDuration)
    : durations;
  return (
    <fieldset>
      <div className="space-y-4">
        {availableDurations.map(({ value, label }) => (
          <div key={value} className="flex items-center">
            <input
              id={label}
              type="radio"
              checked={value === duration}
              onChange={() => setDuration(value)}
              className="h-4 w-4 border-gray-300 text-rose-400 focus:ring-rose-400"
            />
            <label
              htmlFor={label}
              className="ml-3 block text-sm font-medium leading-6 text-gray-900"
            >
              {label}
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
          const formattedDay = format(d.Start, "EEEE, MMMM d");
          return (
            <div key={formattedDay} className="flex items-center">
              <input
                id={formattedDay}
                type="radio"
                checked={d.Start === day.Start}
                onChange={() => setDay(d)}
                className="h-4 w-4 border-gray-300 text-rose-400 focus:ring-rose-400"
              />
              <label
                htmlFor={formattedDay}
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
