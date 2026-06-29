"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { ActiveStay } from "@/types/stay";

type PosGuestPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stays: ActiveStay[];
  onSelect: (stay: ActiveStay) => void;
};

export function PosGuestPicker({
  open,
  onOpenChange,
  stays,
  onSelect,
}: PosGuestPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return stays;
    return stays.filter(
      (stay) =>
        stay.guestName.toLowerCase().includes(normalized) ||
        stay.roomNumber.toLowerCase().includes(normalized) ||
        stay.reservationNumber.toLowerCase().includes(normalized)
    );
  }, [search, stays]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Checked-In Guest</DialogTitle>
          <DialogDescription>
            Charge retail items to an in-house guest folio (Stage 5).
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Guest, room, reservation…"
            className="pl-9"
          />
        </div>

        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {!filtered.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No checked-in guests match your search.
            </p>
          ) : (
            filtered.map((stay) => (
              <button
                key={stay.reservationId}
                type="button"
                onClick={() => {
                  onSelect(stay);
                  onOpenChange(false);
                }}
                className="w-full rounded-lg border p-3 text-left transition hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{stay.guestName}</p>
                    <p className="text-sm text-muted-foreground">
                      Room {stay.roomNumber} · {stay.reservationNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stay.roomTypeName}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Balance</p>
                    <p className="font-semibold">{formatCurrency(stay.balance)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
