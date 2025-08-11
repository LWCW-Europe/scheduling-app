"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Fuse from "fuse.js";
import {
  PencilIcon,
  ClockIcon,
  UserIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

import HoverTooltip from "@/app/hover-tooltip";
import { UserContext } from "@/app/context";
import type { SessionProposal } from "@/db/sessionProposals";
import type { Guest } from "@/db/guests";
import {
  inSchedPhase,
  inVotingPhase,
  dateStartDescription,
} from "@/app/utils/events";
import type { Event } from "@/db/events";
import { Vote, VoteChoice } from "@/app/votes";

const ITEMS_PER_PAGE = 1000;

type SortConfig = {
  key: keyof SessionProposal;
  direction: "asc" | "desc";
};

type Filter = "mine" | "voted" | "unvoted" | undefined;

export function ProposalTable({
  guests,
  proposals: paramProposals,
  eventSlug,
  event,
  initialVotes,
}: {
  guests: Guest[];
  proposals: SessionProposal[];
  eventSlug: string;
  event: Event;
  initialVotes: Vote[];
}) {
  const initialProposals = paramProposals.map((proposal) => {
    const hostNames = proposal.hosts.map(
      (h) => guests.find((g) => g.ID === h)?.Name || ""
    );
    return { ...proposal, hostNames };
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [resultFilter, setResultFilter] = useState<Filter>(undefined);
  const [votes, setVotes] = useState(initialVotes);
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    inVotingPhase(event)
      ? {
          key: "votesCount",
          direction: "asc",
        }
      : {
          key: "createdTime",
          direction: "desc",
        }
  );
  const { user: currentUserId } = useContext(UserContext);
  const router = useRouter();
  const filteredProposals = initialProposals.filter((pr) => {
    if (currentUserId && resultFilter) {
      const isMine = pr.hosts.includes(currentUserId);
      const hasVoted = votes.some((vote) => vote.proposal === pr.id);
      let actual: Filter;
      if (isMine) {
        actual = "mine";
      } else if (hasVoted) {
        actual = "voted";
      } else {
        actual = "unvoted";
      }
      return resultFilter === actual;
    } else {
      return true;
    }
  });
  const totalPages = Math.ceil(filteredProposals.length / ITEMS_PER_PAGE);
  const votingEnabled = !!currentUserId && inVotingPhase(event);
  const schedEnabled = inSchedPhase(event);
  const votingDisabledText = !inVotingPhase(event)
    ? `Voting ${dateStartDescription(event.votingPhaseStart)}`
    : "Select a user first";
  const schedDisabledText =
    "Scheduling " + dateStartDescription(event.schedulingPhaseStart);
  function updateResultFilter(newFilter: Filter) {
    setPage(1);
    setResultFilter((oldFilter) =>
      oldFilter === newFilter ? undefined : newFilter
    );
  }
  useEffect(() => {
    if (!currentUserId) {
      setResultFilter(undefined);
    }
  }, [currentUserId]);
  const fuse = new Fuse(filteredProposals, {
    keys: [
      {
        name: "title",
        weight: 0.6,
      },
      {
        name: "hostNames",
        weight: 0.25,
      },
      {
        name: "description",
        weight: 0.15,
      },
    ],
  });
  const searchResults = searchQuery.trim()
    ? fuse.search(searchQuery).map((res) => res.item)
    : filteredProposals;
  searchResults.sort((a, b) => {
    if (searchQuery.trim()) {
      return 0;
    }
    const { key, direction } = sortConfig;

    let cmp = 0;
    if (key === "title") {
      cmp = a[key].localeCompare(b[key]);
    } else if (key === "hosts") {
      if (a[key].length === 0 && b[key].length === 0) {
        cmp = 0;
      } else if (a[key].length === 0) {
        cmp = -1;
      } else if (b[key].length === 0) {
        cmp = 1;
      } else {
        const hostNames = (hosts: string[]) =>
          guests
            .filter((g) => hosts.includes(g.ID))
            .map((g) => g.Name)
            .sort()
            .join("");
        cmp = hostNames(a.hosts).localeCompare(hostNames(b.hosts));
      }
    } else if (key === "durationMinutes") {
      cmp = (a[key] || 0) - (b[key] || 0);
    } else if (key === "createdTime") {
      cmp = new Date(a[key]).getTime() - new Date(b[key]).getTime();
    } else if (key === "votesCount") {
      cmp = (a[key] || 0) - (b[key] || 0);
    }
    return direction === "asc" ? cmp : -cmp;
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setPage(1);
    }
  };

  const getPageNumbers = () => {
    const arrowCss =
      "px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed";
    const currentPageNumCss = "bg-blue-600 text-white";
    const otherPageNumCss =
      "text-gray-700 bg-white border border-gray-300 hover:bg-gray-200";
    const pages = [
      { display: "<<", toPage: 1, css: arrowCss },
      { display: "<", toPage: Math.max(page - 1, 1), css: arrowCss },
    ];
    for (
      let i = Math.max(1, page - 2);
      i <= Math.min(page + 2, totalPages);
      i++
    ) {
      const css = i === page ? currentPageNumCss : otherPageNumCss;
      pages.push({
        display: i.toString(),
        toPage: i,
        css,
      });
    }
    pages.push({
      display: ">",
      toPage: Math.min(page + 1, totalPages),
      css: arrowCss,
    });
    pages.push({ display: ">>", toPage: totalPages, css: arrowCss });
    return pages;
  };

  const currentPageProposals = searchResults.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const visitViewPage = (proposal: SessionProposal) => {
    router.push(`/${eventSlug}/proposals/${proposal.id}/view`);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const canEdit = (hosts: string[]) => {
    if (hosts.length === 0) {
      return true;
    } else {
      return currentUserId && hosts.includes(currentUserId);
    }
  };

  const handleSort = (key: keyof SessionProposal) => {
    let direction: "asc" | "desc" = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  const eventName = eventSlug.replace(/-/g, " ");
  useEffect(() => {
    if (!currentUserId) {
      return;
    } else if (!votes.every((vote) => vote.guest !== currentUserId)) {
      return;
    }

    const fetchVotes = async (user: string) => {
      const res = await fetch(`/api/votes?user=${user}&event=${eventName}`);
      const newVotes = (await res.json()) as Vote[];
      if (!(votes.length === 0 && newVotes.length === 0)) {
        setVotes(newVotes);
      }
    };

    void fetchVotes(currentUserId);
  }, [currentUserId, eventName, votes]);

  // update votes optimistically
  async function vote(proposalId: string, choice: VoteChoice) {
    if (!votingEnabled) {
      return;
    }
    setVotes((prev) => prev.filter((v) => v.proposal !== proposalId));
    const existingVote = votes.find((v) => v.proposal === proposalId);
    if (existingVote?.choice === choice) {
      return deleteVote(proposalId);
    }
    const votesAtStart = votes;

    try {
      const newVote: Vote = {
        proposal: proposalId,
        guest: currentUserId,
        choice: choice,
      };
      setVotes((prevVotes) => [...prevVotes, newVote]);

      const response = await fetch("/api/add-vote", {
        method: "POST",
        body: JSON.stringify(newVote),
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        setVotes(votesAtStart);
      }
      return response.ok;
    } catch (error: unknown) {
      // Revert optimistic update on error
      console.error("Error updating vote: ", error);
      setVotes(votesAtStart);
      return false;
    }
  }

  async function deleteVote(proposalId: string) {
    const votesAtStart = votes;
    try {
      const response = await fetch("/api/delete-vote", {
        method: "POST",
        body: JSON.stringify({
          proposalId,
          guestId: currentUserId,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        setVotes(votesAtStart);
      }
      return response.ok;
    } catch (error: unknown) {
      // Revert optimistic update on error
      console.error("Error deleting vote: ", error);
      setVotes(votesAtStart);
      return false;
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Section */}
      <div className="w-full">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="lg:flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>
              <span className="text-xs text-gray-500">
                ({searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative inline-block group">
                <button
                  className={`disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white px-3 py-2 rounded-md transition-colors inline-flex items-center gap-2 ${
                    resultFilter === "mine"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : currentUserId
                        ? "bg-gray-400 hover:bg-gray-500"
                        : "bg-gray-400"
                  }`}
                  onClick={() => updateResultFilter("mine")}
                  disabled={!currentUserId}
                  aria-pressed={resultFilter === "mine"}
                  aria-label={`Filter to show only your proposals${resultFilter === "mine" ? " (active)" : ""}`}
                >
                  <UserIcon className="h-4 w-4" />
                  My proposals
                  {resultFilter === "mine" && (
                    <span className="bg-blue-800 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {filteredProposals.length}
                    </span>
                  )}
                </button>
                {!currentUserId && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Select a user first
                  </div>
                )}
              </div>
              <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
                <button
                  className={`disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white px-3 py-2 rounded-md transition-colors inline-flex items-center gap-2 ${
                    resultFilter === "unvoted"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : currentUserId
                        ? "bg-gray-400 hover:bg-gray-500"
                        : "bg-gray-400"
                  }`}
                  disabled={!votingEnabled}
                  aria-label="Filter to show only unvoted proposals"
                  onClick={() => updateResultFilter("unvoted")}
                >
                  <EyeSlashIcon className="h-4 w-4" />
                  Only unvoted
                  {resultFilter === "unvoted" && (
                    <span className="bg-blue-800 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {filteredProposals.length}
                    </span>
                  )}
                </button>
              </HoverTooltip>
              <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
                <button
                  className={`disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white px-3 py-2 rounded-md transition-colors inline-flex items-center gap-2 ${
                    resultFilter === "voted"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : currentUserId
                        ? "bg-gray-400 hover:bg-gray-500"
                        : "bg-gray-400"
                  }`}
                  disabled={!votingEnabled}
                  aria-label="Filter to show only voted proposals"
                  onClick={() => updateResultFilter("voted")}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Only voted
                  {resultFilter === "voted" && (
                    <span className="bg-blue-800 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {filteredProposals.length}
                    </span>
                  )}
                </button>
              </HoverTooltip>
              {resultFilter && (
                <button
                  onClick={() => updateResultFilter(undefined)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors inline-flex items-center gap-1"
                  aria-label="Clear all active filters"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="lg:w-80">
            <input
              type="text"
              placeholder="Search proposals..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table-fixed w-full divide-y divide-gray-200 min-w-0">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort("title")}
                scope="col"
                className={`w-[20%] text-left px-4 lg:px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-200
                  ${sortConfig.key === "title" && !searchQuery.trim() ? "text-gray-900 font-semibold" : "text-gray-500"}`}
              >
                Title
                {!searchQuery.trim() &&
                  (sortConfig.key === "title"
                    ? sortConfig.direction === "asc"
                      ? " ↓"
                      : " ↑"
                    : " ↑↓")}
              </th>
              <th
                onClick={() => handleSort("hosts")}
                scope="col"
                className={`w-[15%] px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-200
                  ${sortConfig.key === "hosts" && !searchQuery.trim() ? "text-gray-900 font-semibold" : "text-gray-500"}`}
              >
                Host(s)
                {!searchQuery.trim() &&
                  (sortConfig.key === "hosts"
                    ? sortConfig.direction === "asc"
                      ? " ↓"
                      : " ↑"
                    : " ↑↓")}
              </th>
              <th
                scope="col"
                className="w-[25%] px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                onClick={() => handleSort("durationMinutes")}
                scope="col"
                className={`w-[10%] px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-200
                  ${sortConfig.key === "durationMinutes" && !searchQuery.trim() ? "text-gray-900 font-semibold" : "text-gray-500"}`}
              >
                Duration
                {!searchQuery.trim() &&
                  (sortConfig.key === "durationMinutes"
                    ? sortConfig.direction === "asc"
                      ? " ↓"
                      : " ↑"
                    : " ↑↓")}
              </th>
              <th
                scope="col"
                className="w-[10%] px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Your vote
              </th>
              <th
                scope="col"
                className="w-[20%] px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentPageProposals.map((proposal) => (
              <tr key={proposal.id} className="hover:bg-gray-200">
                <td
                  className="px-4 lg:px-6 py-4 whitespace-nowrap"
                  title={proposal.title}
                >
                  <Link
                    href={`/${eventSlug}/proposals/${proposal.id}/view`}
                    scroll={false}
                    className="block w-full"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {proposal.title}
                    </div>
                  </Link>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="truncate">
                    {proposal.hosts
                      .map(
                        (host) =>
                          guests.find((g) => g.ID === host)?.Name || "Deleted"
                      )
                      .join(", ") || "-"}
                  </div>
                </td>
                <td
                  className="px-4 lg:px-6 py-4 whitespace-nowrap"
                  title={proposal.description}
                >
                  <div className="text-sm text-gray-500 truncate">
                    {proposal.description || "-"}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {proposal.durationMinutes ? (
                      <>
                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-500 truncate">
                          {formatDuration(proposal.durationMinutes)}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  {currentUserId && !proposal.hosts.includes(currentUserId) && (
                    <div className="flex gap-1 flex-col sm:flex-row">
                      <HoverTooltip
                        text={votingEnabled ? "Interested" : votingDisabledText}
                        visible={true}
                      >
                        <button
                          type="button"
                          className={`rounded-md border border-black shadow-sm px-1 py-1 font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none
                            ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale"}
                            ${votes.some((vote) => vote.proposal === proposal.id && vote.choice === VoteChoice.interested) ? "bg-blue-200" : "bg-white"}`}
                          disabled={!votingEnabled}
                          onClick={(e) => {
                            void vote(proposal.id, VoteChoice.interested);
                            e.stopPropagation();
                          }}
                        >
                          ❤️
                        </button>
                      </HoverTooltip>
                      <HoverTooltip
                        text={votingEnabled ? "Maybe" : votingDisabledText}
                        visible={true}
                      >
                        <button
                          type="button"
                          className={`rounded-md border border-black shadow-sm px-1 py-1 font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none
                            ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale"}
                            ${votes.some((vote) => vote.proposal === proposal.id && vote.choice === VoteChoice.maybe) ? "bg-blue-200" : "bg-white"}`}
                          disabled={!votingEnabled}
                          onClick={(e) => {
                            void vote(proposal.id, VoteChoice.maybe);
                            e.stopPropagation();
                          }}
                        >
                          ⭐
                        </button>
                      </HoverTooltip>
                      <HoverTooltip
                        text={votingEnabled ? "Skip" : votingDisabledText}
                        visible={true}
                      >
                        <button
                          type="button"
                          className={`rounded-md border border-black shadow-sm px-1 py-1 font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none
                            ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale"}
                            ${votes.some((vote) => vote.proposal === proposal.id && vote.choice === VoteChoice.skip) ? "bg-blue-200" : "bg-white"}`}
                          disabled={!votingEnabled}
                          onClick={(e) => {
                            void vote(proposal.id, VoteChoice.skip);
                            e.stopPropagation();
                          }}
                        >
                          👋🏽
                        </button>
                      </HoverTooltip>
                    </div>
                  )}
                </td>
                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-1 flex-col sm:flex-row">
                    {canEdit(proposal.hosts) && (
                      <div className="relative inline-block group">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/${eventSlug}/proposals/${proposal.id}/edit`
                            );
                          }}
                          className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 transition-colors"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                      </div>
                    )}
                    {canEdit(proposal.hosts) && (
                      <HoverTooltip
                        text={schedDisabledText}
                        visible={!schedEnabled}
                      >
                        <button
                          onClick={() =>
                            router.push(
                              `/${eventSlug}/add-session?proposalID=${proposal.id}`
                            )
                          }
                          className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 ${
                            schedEnabled
                              ? "hover:bg-rose-50 transition-colors"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          disabled={!schedEnabled}
                        >
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Schedule
                        </button>
                      </HoverTooltip>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {searchResults.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 lg:px-6 py-4 text-center text-sm text-gray-500"
                >
                  No proposals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {currentPageProposals.map((proposal) => (
          <div
            key={proposal.id}
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
                      (host) =>
                        guests.find((g) => g.ID === host)?.Name || "Deleted"
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

              {proposal.durationMinutes ? (
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {formatDuration(proposal.durationMinutes)}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-500">-</div>
              )}

              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex gap-1">
                  <HoverTooltip
                    text={votingEnabled ? "Interested" : votingDisabledText}
                    visible={true}
                  >
                    <button
                      type="button"
                      className={`rounded-md border border-black shadow-sm px-2 py-1 font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none
                        ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale"}
                        ${votes.some((vote) => vote.proposal === proposal.id && vote.choice === VoteChoice.interested) ? "bg-blue-200" : "bg-white"}`}
                      disabled={!votingEnabled}
                      onClick={(e) => {
                        void vote(proposal.id, VoteChoice.interested);
                        e.stopPropagation();
                      }}
                    >
                      ❤️
                    </button>
                  </HoverTooltip>
                  <HoverTooltip
                    text={votingEnabled ? "Maybe" : votingDisabledText}
                    visible={true}
                  >
                    <button
                      type="button"
                      className={`rounded-md border border-black shadow-sm px-2 py-1 font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none
                        ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale"}
                        ${votes.some((vote) => vote.proposal === proposal.id && vote.choice === VoteChoice.maybe) ? "bg-blue-200" : "bg-white"}`}
                      disabled={!votingEnabled}
                      onClick={(e) => {
                        void vote(proposal.id, VoteChoice.maybe);
                        e.stopPropagation();
                      }}
                    >
                      ⭐
                    </button>
                  </HoverTooltip>
                  <HoverTooltip
                    text={votingEnabled ? "Skip" : votingDisabledText}
                    visible={true}
                  >
                    <button
                      type="button"
                      className={`rounded-md border border-black shadow-sm px-2 py-1 font-medium focus:ring-2 focus:ring-offset-2 text-black focus:outline-none
                        ${votingEnabled ? "" : "opacity-50 cursor-not-allowed grayscale"}
                        ${votes.some((vote) => vote.proposal === proposal.id && vote.choice === VoteChoice.skip) ? "bg-blue-200" : "bg-white"}`}
                      disabled={!votingEnabled}
                      onClick={(e) => {
                        void vote(proposal.id, VoteChoice.skip);
                        e.stopPropagation();
                      }}
                    >
                      👋🏽
                    </button>
                  </HoverTooltip>
                </div>

                <div className="flex gap-2">
                  {canEdit(proposal.hosts) && (
                    <div className="relative inline-block group">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/${eventSlug}/proposals/${proposal.id}/edit`
                          );
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-rose-400 text-rose-400 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  )}
                  {canEdit(proposal.hosts) && (
                    <HoverTooltip
                      text={schedDisabledText}
                      visible={!schedEnabled}
                    >
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-rose-400 text-rose-400 opacity-50 cursor-not-allowed"
                        disabled={!schedEnabled}
                      >
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Schedule
                      </button>
                    </HoverTooltip>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {searchResults.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No proposals found
          </div>
        )}
      </div>
      {searchResults.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {getPageNumbers().map(({ display, toPage, css }) => (
            <button
              key={display}
              onClick={() => setPage(toPage)}
              disabled={page == toPage}
              className={
                "px-2 sm:px-3 py-2 text-sm font-medium rounded-md " + css
              }
            >
              {display}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
