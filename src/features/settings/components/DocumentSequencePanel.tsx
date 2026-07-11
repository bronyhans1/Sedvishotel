"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getDocumentSequenceStateAction,
  getDocumentNumberPreviewsAction,
  setDocumentSequenceAction,
} from "@/features/documents/actions";
import { useToast } from "@/hooks/use-toast";
import type { DocumentKind } from "@/repositories/document-numbering.repository";
import type { HotelSettings } from "@/types/settings";

type Props = {
  settings: HotelSettings;
  isAdmin: boolean;
};

function SequencePreview({
  label,
  preview,
}: {
  label: string;
  preview: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-mono font-semibold">{preview || "—"}</p>
    </div>
  );
}

export function DocumentNumberPreviewPanel({ settings }: Pick<Props, "settings">) {
  const [previews, setPreviews] = useState({ invoice: "", receipt: "" });

  useEffect(() => {
    let cancelled = false;
    void getDocumentNumberPreviewsAction().then((result) => {
      if (!cancelled && result.success) {
        setPreviews(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    settings.invoicePrefix,
    settings.invoiceStartingNumber,
    settings.receiptPrefix,
    settings.receiptStartingNumber,
  ]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SequencePreview label="Next Invoice Number" preview={previews.invoice} />
      <SequencePreview label="Next Receipt Number" preview={previews.receipt} />
    </div>
  );
}

function SequenceManagerCard({
  kind,
  title,
  isAdmin,
}: {
  kind: DocumentKind;
  title: string;
  isAdmin: boolean;
}) {
  const toast = useToast();
  const [nextNumber, setNextNumber] = useState("");
  const [preview, setPreview] = useState("");
  const [minimum, setMinimum] = useState(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getDocumentNumberPreviewsAction(),
      getDocumentSequenceStateAction(kind),
    ]).then(([previewResult, stateResult]) => {
      if (cancelled) return;
      if (previewResult.success) {
        setPreview(
          kind === "invoice"
            ? previewResult.data.invoice
            : previewResult.data.receipt
        );
      }
      if (stateResult.success) {
        setMinimum(stateResult.data.minimumAllowed);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  if (!isAdmin) return null;

  function handleApply() {
    const value = Number(nextNumber);
    if (!Number.isFinite(value) || value < minimum) {
      toast.error(`Sequence must be at least ${minimum}.`);
      return;
    }

    startTransition(async () => {
      const result = await setDocumentSequenceAction(kind, value);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setPreview(result.data.nextPreview);
      setMinimum(result.data.minimumAllowed);
      setNextNumber("");
      toast.celebrate("Sequence Updated", `${title} numbering updated.`);
    });
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <h3 className="font-medium">{title} Sequence</h3>
        <p className="text-sm text-muted-foreground">
          Preview: <span className="font-mono">{preview}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Minimum allowed next number: {minimum}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${kind}-sequence`}>Set Next Number</Label>
        <Input
          id={`${kind}-sequence`}
          type="number"
          min={minimum}
          value={nextNumber}
          onChange={(e) => setNextNumber(e.target.value)}
          placeholder={String(minimum)}
        />
      </div>
      <Button type="button" size="sm" onClick={handleApply} disabled={isPending}>
        {isPending ? "Updating…" : "Apply Sequence"}
      </Button>
    </div>
  );
}

export function DocumentSequenceManager({ isAdmin }: Pick<Props, "isAdmin">) {
  if (!isAdmin) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SequenceManagerCard kind="invoice" title="Invoice" isAdmin={isAdmin} />
      <SequenceManagerCard kind="receipt" title="Receipt" isAdmin={isAdmin} />
    </div>
  );
}
