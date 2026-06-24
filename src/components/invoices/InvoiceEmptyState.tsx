import { FileText } from "lucide-react";

import { SHMSEmptyState } from "@/components/shared/SHMSEmptyState";

type Props = {
  className?: string;
};

export function InvoiceEmptyState({ className }: Props) {
  return (
    <SHMSEmptyState
      className={className}
      icon={FileText}
      title="No invoices yet"
      description="Generate an invoice from a checked-out or active reservation to manage billing documents."
    />
  );
}
