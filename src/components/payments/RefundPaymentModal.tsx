"use client";

import { useState, useTransition } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { refundPaymentAction } from "@/features/payments/actions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import { useToast } from "@/hooks/use-toast";
import {
  exceedsRefundableAmount,
  OVER_REFUND_ERROR,
  roundCurrency,
} from "@/lib/payments/currency";
import { formatCurrency } from "@/lib/utils";
import {
  PAYMENT_METHOD_OPTIONS,
  REFUND_REASON_OPTIONS,
  type RefundFormValues,
  type TransactionPaymentMethod,
} from "@/types/payment";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const initial: RefundFormValues = {
  amount: 0,
  method: "cash",
  reason: REFUND_REASON_OPTIONS[0],
  notes: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  maxRefundable: number;
};

export function RefundPaymentModal({
  open,
  onOpenChange,
  paymentId,
  maxRefundable,
}: Props) {
  const toast = useToast();
  const refresh = useLiveRefresh();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose(next: boolean) {
    if (!next) {
      setValues({ ...initial, amount: maxRefundable });
      setError(null);
    }
    onOpenChange(next);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setValues((current) => ({
        ...current,
        amount: roundCurrency(maxRefundable),
      }));
    }
    handleClose(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const requestedAmount = roundCurrency(values.amount);

    if (exceedsRefundableAmount(requestedAmount, maxRefundable)) {
      setError(OVER_REFUND_ERROR);
      return;
    }

    startTransition(async () => {
      const result = await refundPaymentAction(paymentId, {
        ...values,
        amount: requestedAmount,
      });
      if (result.success) {
        handleClose(false);
        toast.celebrate("Refund Processed", "Refund recorded successfully.");
        refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Issue a partial or full refund against this payment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
            <p className="text-muted-foreground">Maximum Refundable Amount</p>
            <p className="text-lg font-semibold">{formatCurrency(maxRefundable)}</p>
          </div>

          <div className="space-y-2">
            <Label>Refund Amount (GHS)</Label>
            <Input
              type="number"
              min={0.01}
              max={maxRefundable}
              step={0.01}
              required
              value={values.amount || ""}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  amount: roundCurrency(
                    Math.min(maxRefundable, Number(e.target.value) || 0)
                  ),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Refund Method</Label>
            <select
              value={values.method}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  method: e.target.value as TransactionPaymentMethod,
                }))
              }
              className={selectClass}
            >
              {PAYMENT_METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <select
              required
              value={values.reason}
              onChange={(e) =>
                setValues((v) => ({ ...v, reason: e.target.value }))
              }
              className={selectClass}
            >
              {REFUND_REASON_OPTIONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={values.notes}
              onChange={(e) =>
                setValues((v) => ({ ...v, notes: e.target.value }))
              }
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <SubmitButton loading={isPending} loadingLabel="Processing Refund…">
              Process Refund
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
