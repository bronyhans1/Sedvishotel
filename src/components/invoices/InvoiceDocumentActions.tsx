"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ExternalLink, FileText, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateInvoiceAction } from "@/features/invoices/actions";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceAccess } from "@/lib/auth/invoice-access.types";
import type { Invoice } from "@/types/invoice";

type Props = {
  reservationId: string;
  guestId?: string;
  folioId?: string;
  invoice: Invoice | null;
  access: InvoiceAccess;
  compact?: boolean;
};

export function InvoiceDocumentActions({
  reservationId,
  guestId,
  folioId,
  invoice,
  access,
  compact = false,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  if (!access.canView && !access.canCreate) {
    return null;
  }

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateInvoiceAction(reservationId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.celebrate(
        invoice ? "Invoice Ready" : "Invoice Generated",
        invoice
          ? "Opened the existing invoice for this reservation."
          : "Invoice created successfully."
      );
      router.push(`/dashboard/invoices/${result.invoiceId}`);
      router.refresh();
    });
  }

  const buttonSize = compact ? "sm" : "default";

  if (invoice) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size={buttonSize} asChild>
          <Link href={`/dashboard/invoices/${invoice.id}`}>
            <FileText className="h-4 w-4" />
            View Invoice
          </Link>
        </Button>
        <Button variant="outline" size={buttonSize} asChild>
          <Link href={`/dashboard/invoices/${invoice.id}?print=1`}>
            <Printer className="h-4 w-4" />
            Print Invoice
          </Link>
        </Button>
        {guestId ? (
          <Button variant="ghost" size={buttonSize} asChild>
            <Link href={`/dashboard/guests/${guestId}`}>
              <ExternalLink className="h-4 w-4" />
              Guest
            </Link>
          </Button>
        ) : null}
        {folioId ? (
          <Button variant="ghost" size={buttonSize} asChild>
            <Link href={`/dashboard/guest-folio/${folioId}`}>
              <ExternalLink className="h-4 w-4" />
              Folio
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  if (!access.canCreate) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size={buttonSize}
      onClick={handleGenerate}
      disabled={isPending}
    >
      <FileText className="h-4 w-4" />
      {isPending ? "Generating…" : "Generate Invoice"}
    </Button>
  );
}
