"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
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

const ITEMS_PER_PAGE = 1000;

type SortConfig = {
  key: keyof SessionProposal;
  direction: "asc" | "desc";
};

export function ProposalTable({
  guests,
  proposals: paramProposals,
  eventSlug,
  event,
}: {
  guests: Guest[];
  proposals: SessionProposal[];
  eventSlug: string;
  event: Event;
}) {
  const initialProposals = paramProposals.map((proposal) => {
    const hostNames = proposal.hosts.map(
      (h) => guests.find((g) => g.ID === h)?.Name || ""
    );
    return { ...proposal, hostNames };
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [myProposals, setMyProposals] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdTime",
    direction: "desc",
  });
  const { user: currentUserId } = useContext(UserContext);
  const router = useRouter();
  const filteredProposals = initialProposals.filter((pr) => {
    if (myProposals && currentUserId) {
      if (!pr.hosts.includes(currentUserId)) {
        return false;
      }
    }
    return true;
  });
  const totalPages = Math.ceil(filteredProposals.length / ITEMS_PER_PAGE);
  const votingEnabled = inVotingPhase(event);
  const schedEnabled = inSchedPhase(event);
  const votingDisabledText = `Voting ${dateStartDescription(event.votingPhaseStart)}`;
  const schedDisabledText = `Scheduling ${dateStartDescription(event.schedulingPhaseStart)}`;
  function updateMyProposals(newValue: boolean) {
    setPage(1);
    setMyProposals(newValue);
  }
  useEffect(() => {
    if (!currentUserId) {
      setMyProposals(false);
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
    router.push(`/${eventSlug}/proposals/${proposal.id}`);
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
                    myProposals
                      ? "bg-blue-600 hover:bg-blue-700"
                      : currentUserId
                        ? "bg-gray-400 hover:bg-gray-500"
                        : "bg-gray-400"
                  }`}
                  onClick={() => updateMyProposals(!myProposals)}
                  disabled={!currentUserId}
                  aria-pressed={myProposals}
                  aria-label={`Filter to show only your proposals${myProposals ? " (active)" : ""}`}
                >
                  <UserIcon className="h-4 w-4" />
                  My proposals
                  {myProposals && currentUserId && (
                    <span className="bg-blue-800 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {searchResults.length}
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
                  className="disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white px-3 py-2 rounded-md bg-gray-400 transition-colors inline-flex items-center gap-2"
                  disabled={!votingEnabled}
                  aria-label="Filter to show only unvoted proposals (not available yet)"
                >
                  <EyeSlashIcon className="h-4 w-4" />
                  Only unvoted
                </button>
              </HoverTooltip>
              <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
                <button
                  className="disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white px-3 py-2 rounded-md bg-gray-400 transition-colors inline-flex items-center gap-2"
                  disabled={!votingEnabled}
                  aria-label="Filter to show only voted proposals (not available yet)"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Only voted
                </button>
              </HoverTooltip>
              {myProposals && (
                <button
                  onClick={() => {
                    setMyProposals(false);
                    setPage(1);
                  }}
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
                  ${sortConfig.key === "title" ? "text-gray-900 font-semibold" : "text-gray-500"}`}
              >
                Title
                {sortConfig.key === "title"
                  ? sortConfig.direction === "asc"
                    ? " ↓"
                    : " ↑"
                  : " ↑↓"}
              </th>
              <th
                onClick={() => handleSort("hosts")}
                scope="col"
                className={`w-[15%] px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-200
                  ${sortConfig.key === "hosts" ? "text-gray-900 font-semibold" : "text-gray-500"}`}
              >
                Host(s)
                {sortConfig.key === "hosts"
                  ? sortConfig.direction === "asc"
                    ? " ↓"
                    : " ↑"
                  : " ↑↓"}
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
                  ${sortConfig.key === "durationMinutes" ? "text-gray-900 font-semibold" : "text-gray-500"}`}
              >
                Duration
                {sortConfig.key === "durationMinutes"
                  ? sortConfig.direction === "asc"
                    ? " ↓"
                    : " ↑"
                  : " ↑↓"}
              </th>
              <th
                scope="col"
                className="w-[10%] px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Your votes
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
              <tr
                key={proposal.id}
                className="hover:bg-gray-200 cursor-pointer"
                onClick={() => visitViewPage(proposal)}
              >
                <td
                  className="px-4 lg:px-6 py-4 whitespace-nowrap"
                  title={proposal.title}
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {proposal.title}
                  </div>
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
                        text={votingDisabledText}
                        visible={!votingEnabled}
                      >
                        <button
                          type="button"
                          className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm px-1 py-1 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale"
                          disabled
                        >
                          ❤️
                        </button>
                      </HoverTooltip>
                      <HoverTooltip
                        text={votingDisabledText}
                        visible={!votingEnabled}
                      >
                        <button
                          type="button"
                          className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm px-1 py-1 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale"
                          disabled
                        >
                          ⭐
                        </button>
                      </HoverTooltip>
                      <HoverTooltip
                        text={votingDisabledText}
                        visible={!votingEnabled}
                      >
                        <button
                          type="button"
                          className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm px-1 py-1 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale"
                          disabled
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
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-rose-400 text-rose-400 opacity-50 cursor-not-allowed"
                          disabled
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
                    text={votingDisabledText}
                    visible={!votingEnabled}
                  >
                    <button
                      type="button"
                      className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm px-2 py-1 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale"
                      disabled
                    >
                      ❤️
                    </button>
                  </HoverTooltip>
                  <HoverTooltip
                    text={votingDisabledText}
                    visible={!votingEnabled}
                  >
                    <button
                      type="button"
                      className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm px-2 py-1 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale"
                      disabled
                    >
                      ⭐
                    </button>
                  </HoverTooltip>
                  <HoverTooltip
                    text={votingDisabledText}
                    visible={!votingEnabled}
                  >
                    <button
                      type="button"
                      className="opacity-50 cursor-not-allowed rounded-md border border-black shadow-sm px-2 py-1 bg-white font-medium text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 grayscale"
                      disabled
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
                        disabled
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
