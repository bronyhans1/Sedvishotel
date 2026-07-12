"use client";

import Link from "next/link";
import {
  Calendar,
  Eye,
  MoreHorizontal,
  Pencil,
  Printer,
  Users,
} from "lucide-react";

import { GroupStatusBadge } from "@/components/group-reservations/GroupStatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GroupListItem } from "@/features/group-reservations/load-group-pages";
import { formatCurrency } from "@/lib/utils";
import { GROUP_TYPE_LABELS } from "@/types/group-reservation";

type Props = {
  groups: GroupListItem[];
  canEdit?: boolean;
};

export function GroupReservationTable({ groups, canEdit }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Group #</th>
              <th className="px-4 py-3 font-semibold">Group Name</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Arrival</th>
              <th className="px-4 py-3 font-semibold">Departure</th>
              <th className="px-4 py-3 font-semibold">Rooms</th>
              <th className="px-4 py-3 font-semibold">Guests</th>
              <th className="px-4 py-3 font-semibold">Balance</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {groups.map((g) => (
              <tr key={g.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-medium">{g.groupNumber}</td>
                <td className="px-4 py-3 font-medium">{g.groupName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {g.corporateAccountName ?? "—"}
                </td>
                <td className="px-4 py-3">{GROUP_TYPE_LABELS[g.groupType]}</td>
                <td className="px-4 py-3 whitespace-nowrap">{g.arrivalDate}</td>
                <td className="px-4 py-3 whitespace-nowrap">{g.departureDate}</td>
                <td className="px-4 py-3">
                  {g.actualRooms}/{g.expectedRooms}
                </td>
                <td className="px-4 py-3">
                  {g.actualGuests}/{g.expectedGuests}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatCurrency(g.outstandingBalance)}
                </td>
                <td className="px-4 py-3">
                  <GroupStatusBadge status={g.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/group-reservations/${g.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/group-reservations/${g.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/group-reservations/${g.id}?tab=overview&edit=1`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/group-reservations/${g.id}?tab=timeline`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Timeline
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/group-reservations/${g.id}?tab=folio`}>
                            <Users className="mr-2 h-4 w-4" />
                            Master Folio
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                          <Printer className="mr-2 h-4 w-4" />
                          Print Summary
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
