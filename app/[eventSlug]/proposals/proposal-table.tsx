"use client";

import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  MoreHorizontal,
  Clock,
  User,
  Eye,
  CheckCircle,
  Calendar,
  Pencil,
  ChevronsRight,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
import { ProposalCard } from "./proposal-card";

type ProposalWithHostNames = SessionProposal & {
  hostNames: string[];
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
  const { user: currentUserId } = useContext(UserContext);
  const router = useRouter();
  const [myProposals, setMyProposals] = useState(false);

  // 1️⃣ Build the data once, only when guests or the prop list changes
  const proposalsWithHostNames = useMemo(() => {
    return paramProposals.map((p) => ({
      ...p,
      hostNames: p.hosts
        .map((h) => guests.find((g) => g.ID === h)?.Name ?? "")
        .sort(),
      duration: p.durationMinutes,
    }));
  }, [paramProposals, guests]);

  // 2️⃣ Filter once, only when the relevant flags change
  const filteredProposals = useMemo(() => {
    if (myProposals && currentUserId)
      return proposalsWithHostNames.filter((p) =>
        p.hosts.includes(currentUserId)
      );
    return proposalsWithHostNames;
  }, [proposalsWithHostNames, myProposals, currentUserId]);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "createdTime",
      desc: true,
    },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    createdTime: false,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const votingEnabled = inVotingPhase(event);
  const schedEnabled = inSchedPhase(event);
  const votingDisabledText = `Voting ${dateStartDescription(event.votingPhaseStart)}`;
  const schedDisabledText = `Scheduling ${dateStartDescription(event.schedulingPhaseStart)}`;

  // Stable helpers
  const canEdit = useCallback(
    (hosts: string[]): boolean =>
      hosts.length === 0 || (!!currentUserId && hosts.includes(currentUserId)),
    [currentUserId]
  );
  const formatDuration = useCallback((minutes?: number) => {
    if (!minutes) return "";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }, []);

  // Now columns really is memoised
  const columns = useMemo<ColumnDef<ProposalWithHostNames>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={`h-auto p-0 ${column.getIsSorted() ? "text-gray-900 font-bold" : "text-gray-500 font-semibold"}`}
            >
              Title
              {column.getIsSorted() ? (
                column.getIsSorted() == "asc" ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUp className="ml-2 h-4 w-4" />
                )
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const proposal = row.original;
          return (
            <a
              href={`/${eventSlug}/proposals/${proposal.id}`}
              className="block text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 max-h-[2.5rem] overflow-hidden"
            >
              {proposal.title}
            </a>
          );
        },
      },
      {
        accessorKey: "hosts",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={`h-auto p-0 ${column.getIsSorted() ? "text-gray-900 font-bold" : "text-gray-500 font-semibold"}`}
            >
              Host(s)
              {column.getIsSorted() ? (
                column.getIsSorted() == "asc" ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUp className="ml-2 h-4 w-4" />
                )
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const proposal = row.original;
          return (
            <div className="text-sm text-gray-500 truncate">
              {proposal.hosts
                .map(
                  (host) => guests.find((g) => g.ID === host)?.Name || "Deleted"
                )
                .join(", ") || "-"}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.hostNames;
          const b = rowB.original.hostNames;
          if (a.length === 0 && b.length === 0) {
            return 0;
          } else if (a.length === 0) {
            return -1;
          } else if (b.length === 0) {
            return 1;
          } else {
            return a.join("").localeCompare(b.join(""));
          }
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="text-sm text-gray-500 line-clamp-2">
            {row.getValue("description") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "duration",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className={`h-auto p-0 ${column.getIsSorted() ? "text-gray-900 font-bold" : "text-gray-500 font-semibold"}`}
            >
              Duration
              {column.getIsSorted() ? (
                column.getIsSorted() == "asc" ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUp className="ml-2 h-4 w-4" />
                )
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const duration = row.getValue("duration");
          return (
            <div className="flex items-center">
              {duration ? (
                <>
                  <Clock className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500 truncate">
                    {formatDuration(duration as number)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">-</span>
              )}
            </div>
          );
        },
        // For sorting
        accessorFn: (row) => row.durationMinutes ?? 0,
      },
      {
        id: "voting",
        header: "Your vote",
        cell: ({ row }) => {
          const proposal = row.original;
          if (!currentUserId || proposal.hosts.includes(currentUserId)) {
            return <div className="h-8 w-32" />; // Placeholder to maintain consistent column width (3 buttons + 2 gaps = ~96px)
          }

          return (
            <div className="flex gap-1 items-center">
              <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
                <Button
                  variant="outline"
                  size="sm"
                  className="opacity-50 cursor-not-allowed h-8 w-8 p-0"
                  disabled
                >
                  ❤️
                </Button>
              </HoverTooltip>
              <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
                <Button
                  variant="outline"
                  size="sm"
                  className="opacity-50 cursor-not-allowed h-8 w-8 p-0"
                  disabled
                >
                  ⭐
                </Button>
              </HoverTooltip>
              <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
                <Button
                  variant="outline"
                  size="sm"
                  className="opacity-50 cursor-not-allowed h-8 w-8 p-0"
                  disabled
                >
                  👋🏽
                </Button>
              </HoverTooltip>
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const proposal = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {canEdit(proposal.hosts) && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        router.push(
                          `/${eventSlug}/proposals/${proposal.id}/edit`
                        );
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit proposal
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/${eventSlug}/proposals/${proposal.id}`);
                  }}
                >
                  View details
                </DropdownMenuItem>
                {canEdit(proposal.hosts) && (
                  <HoverTooltip
                    text={schedDisabledText}
                    visible={!schedEnabled}
                  >
                    <DropdownMenuItem disabled>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule proposal
                    </DropdownMenuItem>
                  </HoverTooltip>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
      {
        accessorKey: "createdTime",
        enableHiding: false,
      },
    ],
    [
      currentUserId,
      eventSlug,
      guests,
      votingEnabled,
      votingDisabledText,
      schedEnabled,
      schedDisabledText,
      canEdit,
      formatDuration,
      router,
    ]
  );

  const table = useReactTable({
    data: filteredProposals,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });
  const page = table.getState().pagination.pageIndex + 1;

  useEffect(() => {
    if (!currentUserId) {
      setMyProposals(false);
    }
  }, [currentUserId]);

  const filteredRowCount = table.getFilteredRowModel().rows.length;

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
                ({filteredRowCount} result
                {filteredRowCount !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative inline-block group">
                <Button
                  variant={myProposals ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setMyProposals(!myProposals)}
                  disabled={!currentUserId}
                  className="inline-flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  My proposals
                  {myProposals && currentUserId && (
                    <span className="bg-blue-800 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {filteredProposals.length}
                    </span>
                  )}
                </Button>
                {!currentUserId && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Select a user first
                  </div>
                )}
              </div>
              <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!votingEnabled}
                  className="inline-flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Only unvoted
                </Button>
              </HoverTooltip>
              <HoverTooltip text={votingDisabledText} visible={!votingEnabled}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!votingEnabled}
                  className="inline-flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Only voted
                </Button>
              </HoverTooltip>
              {myProposals && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMyProposals(false);
                  }}
                  className="text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          <div className="lg:w-80">
            <Input
              placeholder="Search proposals..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {filteredProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            guests={guests}
            eventSlug={eventSlug}
            event={event}
            canEdit={canEdit}
            formatDuration={formatDuration}
          />
        ))}
        {filteredProposals.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No proposals found
          </div>
        )}
      </div>

      {/* Desktop Data Table */}
      <div className="hidden md:block space-y-4">
        <div className="flex items-center py-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No proposals found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-700">Items per page:</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50, 100, 1000].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>

          {table.getPageCount() >= 2 && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-sm font-medium text-gray-700">
                Page {page} of {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={table.previousPage}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from(
                  {
                    length:
                      Math.min(page + 2, table.getPageCount()) -
                      Math.max(1, page - 2) +
                      1,
                  },
                  (_, i) => i + Math.max(1, page - 2)
                ).map((i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 ${page === i ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                    onClick={() => table.setPageIndex(i - 1)}
                  >
                    {i}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={table.nextPage}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
