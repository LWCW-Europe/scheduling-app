"use client";

import { useRouter } from "next/navigation";
import { Clock, Calendar, Pencil } from "lucide-react";

import HoverTooltip from "@/app/hover-tooltip";
import type { SessionProposal } from "@/db/sessionProposals";
import type { Guest } from "@/db/guests";
import type { Event } from "@/db/events";
import { inSchedPhase, dateStartDescription } from "@/app/utils/events";

type ProposalWithHostNames = SessionProposal & {
  hostNames: string[];
  duration?: number;
};

interface ProposalCardProps {
  proposal: ProposalWithHostNames;
  guests: Guest[];
  eventSlug: string;
  event: Event;
  canEdit: (hosts: string[]) => boolean;
  formatDuration: (minutes?: number) => string;
  visitViewPage: (proposal: ProposalWithHostNames) => void;
}

export function ProposalCard({
  proposal,
  guests,
  eventSlug,
  event,
  canEdit,
  formatDuration,
  visitViewPage,
}: ProposalCardProps) {
  const router = useRouter();

  const schedEnabled = inSchedPhase(event);
  const schedDisabledText = `Scheduling ${dateStartDescription(event.schedulingPhaseStart)}`;

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
      onClick={() => visitViewPage(proposal)}
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-medium text-gray-900">
            {proposal.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Host(s):{" "}
            {proposal.hosts
              .map(
                (host) => guests.find((g) => g.ID === host)?.Name || "Deleted"
              )
              .join(", ") || "-"}
          </p>
        </div>

        {proposal.description ? (
          <p className="text-sm text-gray-600 line-clamp-3">
            {proposal.description}
          </p>
        ) : (
          <p className="text-sm text-gray-500">-</p>
        )}

        {proposal.duration ? (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-gray-400" />
            <span className="text-sm text-gray-500">
              {formatDuration(proposal.duration)}
            </span>
          </div>
        ) : (
          <div className="text-sm text-gray-500">-</div>
        )}

        <div className="pt-2 border-t border-gray-100 space-y-3">
          <div className="flex gap-1">
            <button
              type="button"
              className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm px-2 py-1 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale"
              disabled
            >
              ❤️
            </button>
            <button
              type="button"
              className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm px-2 py-1 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale"
              disabled
            >
              ⭐
            </button>
            <button
              type="button"
              className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm px-2 py-1 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale"
              disabled
            >
              👋🏽
            </button>
          </div>

          <div className="flex gap-2">
            {canEdit(proposal.hosts) && (
              <div className="relative inline-block group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${eventSlug}/proposals/${proposal.id}/edit`);
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-rose-400 text-rose-400 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 transition-colors"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            )}
            {canEdit(proposal.hosts) && (
              <HoverTooltip text={schedDisabledText} visible={!schedEnabled}>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-rose-400 text-rose-400 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Schedule
                </button>
              </HoverTooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
