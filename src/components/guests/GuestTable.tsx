import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

import { GuestStatusBadge } from "@/components/guests/GuestStatusBadge";
import { Button } from "@/components/ui/button";
import type { Guest } from "@/types/guest";

type Props = {
  guests: Guest[];
  canEdit?: boolean;
  onEdit?: (guest: Guest) => void;
};

export function GuestTable({ guests, canEdit, onEdit }: Props) {
  const showEdit = canEdit !== false && !!onEdit;
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-semibold">Guest Name</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">
                Email
              </th>
              <th className="px-4 py-3 font-semibold">Nationality</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                Total Visits
              </th>
              <th className="px-4 py-3 font-semibold">VIP</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {guests.map((guest) => (
              <tr key={guest.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{guest.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {guest.phone}
                </td>
                <td className="hidden px-4 py-3 md:table-cell text-muted-foreground">
                  {guest.email}
                </td>
                <td className="px-4 py-3">{guest.nationality}</td>
                <td className="px-4 py-3">
                  <GuestStatusBadge status={guest.guestStatus} />
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {guest.totalVisits}
                </td>
                <td className="px-4 py-3">
                  {guest.vipStatus ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/guests/${guest.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          View
                        </span>
                      </Link>
                    </Button>
                    {showEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit!(guest)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          Edit
                        </span>
                      </Button>
                    )}
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
