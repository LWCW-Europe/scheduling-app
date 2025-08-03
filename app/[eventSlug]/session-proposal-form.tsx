"use client";

import { useState, useContext, useEffect } from "react";
import Link from "next/link";

import { Input } from "./input";
import { UserContext } from "../context";
import {
  createProposal,
  updateProposal,
  deleteProposal,
} from "./proposals/actions";
import { SessionProposal } from "@/db/sessionProposals";
import { SelectHosts } from "@/app/[eventSlug]/session-form";
import { ConfirmDeletionModal } from "../modals";
import { Guest } from "@/db/guests";

const DURATION_OPTIONS = [
  { value: undefined, label: "Undecided" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
];

export function SessionProposalForm(props: {
  eventID: string;
  eventSlug: string;
  proposal?: SessionProposal;
  guests: Guest[];
}) {
  const { eventID, eventSlug, proposal, guests } = props;
  const { user: currentUserId } = useContext(UserContext);

  const [title, setTitle] = useState(proposal?.title || "");
  const [description, setDescription] = useState(proposal?.description || "");
  const [hosts, setHosts] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(
    proposal?.durationMinutes
  );

  useEffect(() => {
    if (proposal) {
      setHosts(proposal.hosts);
    } else if (currentUserId) {
      setHosts([currentUserId]);
    }
  }, [proposal, currentUserId]);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("event", eventID);
    formData.append("eventSlug", eventSlug);
    formData.append("title", title);
    formData.append("description", description || "");
    hosts.forEach((host) => formData.append("hosts", host));
    if (durationMinutes) {
      formData.append("durationMinutes", durationMinutes.toString());
    }

    try {
      let result;
      if (proposal) {
        result = await updateProposal(proposal.id, formData);
      } else {
        result = await createProposal(formData);
      }

      if (result && "error" in result) {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!proposal) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteProposal(proposal.id, eventSlug);

      if (result && "error" in result) {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        className="bg-rose-400 text-white font-semibold py-2 px-4 rounded shadow hover:bg-rose-500 active:bg-rose-500 w-fit px-12"
        href={`/${eventSlug}/proposals`}
      >
        Back to Proposals
      </Link>
      <div>
        <h2 className="text-2xl font-bold">
          {proposal ? "Edit" : "Add"} Session Proposal
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Share your session idea with the community. Only the title is
          required.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <label className="font-medium">
            Title
            <span className="text-rose-500 mx-1">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter a clear, descriptive title"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-medium">Description</label>
          <textarea
            value={description}
            className="rounded-md text-sm resize-none h-24 border bg-white px-4 py-2 shadow-sm transition-colors invalid:border-red-500 invalid:text-red-900 invalid:placeholder-red-300 focus:outline-none disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 border-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:outline-0 focus:border-none"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what your session will cover"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-medium">Host(s)</label>
          <p className="text-sm text-gray-500 mt-1">
            Leave empty if you would like someone to volunteer.
          </p>
          <SelectHosts
            guests={guests}
            hosts={guests.filter((g) => hosts.some((h) => h === g.ID))}
            setHosts={(nextHosts) => setHosts(nextHosts.map((h) => h.ID))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-medium">Duration</label>
          <fieldset>
            <div className="grid gap-3">
              {DURATION_OPTIONS.map(({ value, label }) => (
                <div key={value} className="flex items-center">
                  <input
                    id={`duration-${value}`}
                    type="radio"
                    checked={value === durationMinutes}
                    onChange={() => setDurationMinutes(value)}
                    className="h-4 w-4 border-gray-300 text-rose-400 focus:ring-rose-400"
                  />
                  <label
                    htmlFor={`duration-${value}`}
                    className="ml-3 block text-sm font-medium leading-6 text-gray-900"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        )}

        <button
          type="submit"
          className="bg-rose-400 text-white font-semibold py-2 rounded shadow disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none hover:bg-rose-500 active:bg-rose-500 mx-auto px-12"
          disabled={!title || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {proposal && (
        <ConfirmDeletionModal
          btnDisabled={isSubmitting}
          confirm={handleDelete}
          itemName="session proposal"
        />
      )}
    </div>
  );
}
