"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { InvoiceDocumentActions } from "@/components/invoices/InvoiceDocumentActions";
import { PaymentReceiptActions } from "@/components/payments/PaymentReceiptActions";
import { SubmitButton } from "@/components/loading/SubmitButton";
import { PageContainer } from "@/components/shared/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  closeFolioAction,
  postManualChargeAction,
  postManualCreditAction,
} from "@/features/folio/actions";
import { useToast } from "@/hooks/use-toast";
import { formatFolioSourceLabel } from "@/lib/folio/balance";
import { formatCurrency } from "@/lib/utils";
import type { ReservationFinanceContext } from "@/lib/documents/load-reservation-finance-context";
import type { GuestFolioAccess } from "@/lib/auth/guest-folio-access.types";
import { FOLIO_ENTRY_TYPE_LABELS, type GuestFolio } from "@/types/folio";

type FolioDetailPageContentProps = {
  folio: GuestFolio;
  access: GuestFolioAccess;
  finance: ReservationFinanceContext;
};

export function FolioDetailPageContent({
  folio,
  access,
  finance,
}: FolioDetailPageContentProps) {
  const toast = useToast();
  const [chargeOpen, setChargeOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => window.location.reload());
  }

  async function handleManualCharge(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = Number(amount);
    if (!description.trim() || !value || value <= 0) {
      setError("Enter a description and valid amount.");
      return;
    }
    startTransition(async () => {
      const result = await postManualChargeAction({
        folioId: folio.id,
        description: description.trim(),
        amount: value,
        vatAmount: Number(vatAmount) || 0,
      });
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.celebrate("Charge Posted", "Manual charge added to folio.");
      setChargeOpen(false);
      refresh();
    });
  }

  async function handleManualCredit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = Number(amount);
    if (!description.trim() || !value || value <= 0) {
      setError("Enter a description and valid amount.");
      return;
    }
    startTransition(async () => {
      const result = await postManualCreditAction({
        folioId: folio.id,
        description: description.trim(),
        amount: value,
      });
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.celebrate("Credit Posted", "Manual credit applied to folio.");
      setCreditOpen(false);
      refresh();
    });
  }

  async function handleCloseFolio() {
    startTransition(async () => {
      const result = await closeFolioAction(folio.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate("Folio Closed", `${folio.folioNumber} is now closed.`);
      refresh();
    });
  }

  return (
    <PageContainer
      title={folio.folioNumber}
      description="Guest folio ledger and summary."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/guest-folio">Back to list</Link>
          </Button>
          {access.canCreate && folio.status === "open" ? (
            <>
              <Button size="sm" onClick={() => setChargeOpen(true)}>
                Add Charge
              </Button>
              {access.canManage ? (
                <Button size="sm" variant="secondary" onClick={() => setCreditOpen(true)}>
                  Add Credit
                </Button>
              ) : null}
            </>
          ) : null}
          {access.canManage && folio.status === "open" ? (
            <Button size="sm" variant="outline" onClick={handleCloseFolio} disabled={isPending}>
              Close Folio
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <p><span className="text-muted-foreground">Guest:</span> {folio.guestName}</p>
            <p><span className="text-muted-foreground">Room:</span> {folio.roomNumber}</p>
            <p><span className="text-muted-foreground">Reservation:</span> {folio.reservationNumber}</p>
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              <Badge>{folio.status}</Badge>
            </p>
            <p><span className="text-muted-foreground">Check-In:</span> {folio.checkInDate}</p>
            <p><span className="text-muted-foreground">Check-Out:</span> {folio.checkOutDate}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Debit</th>
                  <th className="px-3 py-2">Credit</th>
                  <th className="px-3 py-2">Balance</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {folio.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {FOLIO_ENTRY_TYPE_LABELS[entry.entryType]}
                    </td>
                    <td className="px-3 py-2">{entry.description}</td>
                    <td className="px-3 py-2">
                      {entry.debitCredit === "debit" ? formatCurrency(entry.total) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {entry.debitCredit === "credit" ? formatCurrency(entry.total) : "—"}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {formatCurrency(entry.runningBalance ?? 0)}
                    </td>
                    <td className="px-3 py-2">
                      {formatFolioSourceLabel(entry.sourceModule)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {entry.sourceReference ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="font-semibold">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Accommodation</span>
              <span>{formatCurrency(folio.summary.accommodation)}</span>
            </div>
            <div className="flex justify-between">
              <span>POS Charges</span>
              <span>{formatCurrency(folio.summary.posCharges)}</span>
            </div>
            <div className="flex justify-between">
              <span>Misc Charges</span>
              <span>{formatCurrency(folio.summary.miscCharges)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discounts</span>
              <span>-{formatCurrency(folio.summary.discounts)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payments</span>
              <span>-{formatCurrency(folio.summary.payments)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT</span>
              <span>{formatCurrency(folio.summary.vat)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Outstanding</span>
              <span>{formatCurrency(folio.outstandingBalance)}</span>
            </div>
          </div>
          <div className="space-y-2 border-t pt-3">
            <h3 className="text-sm font-semibold">Documents</h3>
            <InvoiceDocumentActions
              reservationId={folio.reservationId}
              guestId={folio.guestId}
              folioId={folio.id}
              invoice={finance.invoice}
              access={finance.invoiceAccess}
              compact
            />
            {finance.payment ? (
              <PaymentReceiptActions
                payment={finance.payment}
                receiptBranding={finance.receiptBranding}
                showViewLink
              />
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={chargeOpen} onOpenChange={setChargeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Charge</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualCharge} className="space-y-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div>
              <Label htmlFor="charge-desc">Description</Label>
              <Input id="charge-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="charge-amt">Amount</Label>
              <Input id="charge-amt" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="charge-vat">VAT</Label>
              <Input id="charge-vat" type="number" min={0} step="0.01" value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} />
            </div>
            <DialogFooter>
              <SubmitButton loading={isPending} loadingLabel="Posting…">Post Charge</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={creditOpen} onOpenChange={setCreditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Credit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualCredit} className="space-y-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div>
              <Label htmlFor="credit-desc">Description</Label>
              <Textarea id="credit-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="credit-amt">Amount</Label>
              <Input id="credit-amt" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <DialogFooter>
              <SubmitButton loading={isPending} loadingLabel="Posting…">Post Credit</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
