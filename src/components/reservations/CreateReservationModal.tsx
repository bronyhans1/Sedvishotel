"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { createReservationAction } from "@/features/reservations/actions";
import { useAvailableRooms } from "@/hooks/use-available-rooms";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import type { ReservationRoomTypeOption } from "@/features/reservations/load-reservations-page";
import { mapAvailableRoomsToReservationOptions } from "@/lib/rooms/available-room-options";
import { SubmitButton } from "@/components/loading/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BOOKING_SOURCE_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  type ReservationFormValues,
} from "@/types/reservation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTypeOptions: ReservationRoomTypeOption[];
  onSuccess?: () => void;
};

const initial: ReservationFormValues = {
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  roomNumber: "",
  checkInDate: "",
  checkOutDate: "",
  adults: 1,
  children: 0,
  bookingSource: "phone",
  status: "pending",
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CreateReservationModal({
  open,
  onOpenChange,
  roomTypeOptions,
  onSuccess,
}: Props) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState(initial);
  const [roomTypeId, setRoomTypeId] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  const { rooms, loading: loadingRooms } = useAvailableRooms({
    checkIn: values.checkInDate,
    checkOut: values.checkOutDate,
    roomTypeId: roomTypeId || undefined,
    enabled: open,
  });

  const roomOptions = useMemo(
    () => mapAvailableRoomsToReservationOptions(rooms),
    [rooms]
  );

  useEffect(() => {
    if (!values.roomNumber) return;
    if (!roomOptions.some((room) => room.roomNumber === values.roomNumber)) {
      setValues((v) => ({ ...v, roomNumber: roomOptions[0]?.roomNumber ?? "" }));
    }
  }, [roomOptions, values.roomNumber]);

  function handleClose(next: boolean) {
    if (!next) {
      setValues(initial);
      setRoomTypeId("");
      setErrors({});
      setSubmitError("");
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Partial<Record<string, string>> = {};
    if (!values.guestName.trim()) next.guestName = "Guest name is required";
    if (!values.checkInDate) next.checkInDate = "Check-in date is required";
    if (!values.checkOutDate) next.checkOutDate = "Check-out date is required";
    if (
      values.checkInDate &&
      values.checkOutDate &&
      values.checkOutDate <= values.checkInDate
    ) {
      next.checkOutDate = "Check-out must be after check-in";
    }
    if (!roomTypeId) next.roomType = "Room type is required";
    if (!values.roomNumber) next.roomNumber = "Select an available room";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitError("");
    startTransition(async () => {
      const result = await createReservationAction(values);
      if (!result.success) {
        setSubmitError(result.error);
        toast.error(result.error);
        return;
      }
      handleClose(false);
      toast.celebrate("Reservation Confirmed", "Reservation created successfully.");
      refresh();
      onSuccess?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Reservation</DialogTitle>
          <DialogDescription>
            Register a new guest booking at SEDVIS HOTEL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Guest Name</Label>
              <Input
                value={values.guestName}
                onChange={(e) =>
                  setValues((v) => ({ ...v, guestName: e.target.value }))
                }
              />
              {errors.guestName && (
                <p className="text-xs text-destructive">{errors.guestName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={values.guestPhone}
                onChange={(e) =>
                  setValues((v) => ({ ...v, guestPhone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={values.guestEmail}
                onChange={(e) =>
                  setValues((v) => ({ ...v, guestEmail: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Check-In</Label>
              <Input
                type="date"
                value={values.checkInDate}
                onChange={(e) =>
                  setValues((v) => ({ ...v, checkInDate: e.target.value, roomNumber: "" }))
                }
              />
              {errors.checkInDate && (
                <p className="text-xs text-destructive">{errors.checkInDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Check-Out</Label>
              <Input
                type="date"
                value={values.checkOutDate}
                onChange={(e) =>
                  setValues((v) => ({ ...v, checkOutDate: e.target.value, roomNumber: "" }))
                }
              />
              {errors.checkOutDate && (
                <p className="text-xs text-destructive">{errors.checkOutDate}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Room Type</Label>
            <select
              value={roomTypeId}
              onChange={(e) => {
                setRoomTypeId(e.target.value);
                setValues((v) => ({ ...v, roomNumber: "" }));
              }}
              className={selectClass}
            >
              <option value="">Select room type</option>
              {roomTypeOptions.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.roomType && (
              <p className="text-xs text-destructive">{errors.roomType}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Room Number</Label>
            <select
              value={values.roomNumber}
              onChange={(e) =>
                setValues((v) => ({ ...v, roomNumber: e.target.value }))
              }
              className={selectClass}
              disabled={loadingRooms || roomOptions.length === 0}
            >
              <option value="">
                {loadingRooms
                  ? "Loading available rooms…"
                  : roomOptions.length === 0
                    ? "No rooms available for these dates"
                    : "Select room"}
              </option>
              {roomOptions.map((r) => (
                <option key={r.roomNumber} value={r.roomNumber}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.roomNumber && (
              <p className="text-xs text-destructive">{errors.roomNumber}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Adults</Label>
              <Input
                type="number"
                min={1}
                value={values.adults}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    adults: Number(e.target.value) || 1,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Children</Label>
              <Input
                type="number"
                min={0}
                value={values.children}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    children: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Booking Source</Label>
              <select
                value={values.bookingSource}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    bookingSource: e.target
                      .value as ReservationFormValues["bookingSource"],
                  }))
                }
                className={selectClass}
              >
                {BOOKING_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={values.status}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    status: e.target.value as ReservationFormValues["status"],
                  }))
                }
                className={selectClass}
              >
                {RESERVATION_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton loading={isPending} loadingLabel="Creating Reservation…">
              Create Reservation
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
