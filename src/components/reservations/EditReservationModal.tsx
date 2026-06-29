"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { updateReservationAction } from "@/features/reservations/actions";
import { useAvailableRooms } from "@/hooks/use-available-rooms";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import type { ReservationRoomTypeOption } from "@/features/reservations/load-reservations-page";
import {
  mapAvailableRoomsToReservationOptions,
  mergeCurrentRoomOption,
} from "@/lib/rooms/available-room-options";
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
  RESERVATION_STATUS_OPTIONS,
  type Reservation,
  type ReservationFormValues,
} from "@/types/reservation";

type Props = {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTypeOptions: ReservationRoomTypeOption[];
  onSuccess?: () => void;
};

function toForm(r: Reservation): ReservationFormValues {
  return {
    guestName: r.guestName,
    guestPhone: r.guestPhone,
    guestEmail: r.guestEmail,
    roomNumber: r.roomNumber,
    checkInDate: r.checkInDate,
    checkOutDate: r.checkOutDate,
    adults: r.adults,
    children: r.children,
    bookingSource: r.bookingSource,
    status: r.status,
  };
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EditReservationModal({
  reservation,
  open,
  onOpenChange,
  roomTypeOptions,
  onSuccess,
}: Props) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState<ReservationFormValues | null>(null);
  const [roomTypeId, setRoomTypeId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (reservation) {
      setValues(toForm(reservation));
      setRoomTypeId(reservation.roomTypeId);
      setSubmitError("");
    }
  }, [reservation]);

  const { rooms, loading: loadingRooms } = useAvailableRooms({
    checkIn: values?.checkInDate ?? "",
    checkOut: values?.checkOutDate ?? "",
    roomTypeId: roomTypeId || undefined,
    excludeReservationId: reservation?.id,
    enabled: open && Boolean(values),
  });

  const roomOptions = useMemo(() => {
    const available = mapAvailableRoomsToReservationOptions(rooms);
    if (!reservation) return available;
    return mergeCurrentRoomOption(available, {
      roomNumber: reservation.roomNumber,
      label: `${reservation.roomNumber} — ${reservation.roomTypeName}`,
    });
  }, [rooms, reservation]);

  useEffect(() => {
    if (!values?.roomNumber) return;
    if (!roomOptions.some((room) => room.roomNumber === values.roomNumber)) {
      setValues((v) =>
        v ? { ...v, roomNumber: roomOptions[0]?.roomNumber ?? v.roomNumber } : v
      );
    }
  }, [roomOptions, values?.roomNumber]);

  if (!reservation || !values) return null;

  const editReservation = reservation;
  const formValues = values;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {reservation.reservationNumber}</DialogTitle>
          <DialogDescription>
            Update reservation details. Changes are saved to Supabase.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!formValues.guestName.trim()) {
              setSubmitError("Guest name is required.");
              return;
            }
            if (!formValues.roomNumber) {
              setSubmitError("Select an available room.");
              return;
            }
            setSubmitError("");
            startTransition(async () => {
              const result = await updateReservationAction(
                editReservation.id,
                formValues
              );
              if (!result.success) {
                setSubmitError(result.error);
                toast.error(result.error);
                return;
              }
              onOpenChange(false);
              toast.celebrate(
                "Reservation Updated",
                `${formValues.guestName}'s reservation saved.`
              );
              refresh();
              onSuccess?.();
            });
          }}
        >
          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label>Guest Name</Label>
            <Input
              value={values.guestName}
              onChange={(e) =>
                setValues((v) => (v ? { ...v, guestName: e.target.value } : v))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={values.guestPhone}
                onChange={(e) =>
                  setValues((v) => (v ? { ...v, guestPhone: e.target.value } : v))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={values.guestEmail}
                onChange={(e) =>
                  setValues((v) => (v ? { ...v, guestEmail: e.target.value } : v))
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
                  setValues((v) =>
                    v ? { ...v, checkInDate: e.target.value, roomNumber: "" } : v
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Check-Out</Label>
              <Input
                type="date"
                value={values.checkOutDate}
                onChange={(e) =>
                  setValues((v) =>
                    v ? { ...v, checkOutDate: e.target.value, roomNumber: "" } : v
                  )
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Room Type</Label>
            <select
              value={roomTypeId}
              onChange={(e) => {
                setRoomTypeId(e.target.value);
                setValues((v) => (v ? { ...v, roomNumber: "" } : v));
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
          </div>
          <div className="space-y-2">
            <Label>Room</Label>
            <select
              value={values.roomNumber}
              onChange={(e) =>
                setValues((v) => (v ? { ...v, roomNumber: e.target.value } : v))
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
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={values.status}
              onChange={(e) =>
                setValues((v) =>
                  v
                    ? {
                        ...v,
                        status: e.target.value as ReservationFormValues["status"],
                      }
                    : v
                )
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <SubmitButton loading={isPending} loadingLabel="Saving…">
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
