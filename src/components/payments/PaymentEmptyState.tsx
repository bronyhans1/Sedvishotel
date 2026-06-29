import { CreditCard, Search } from "lucide-react";

import { SHMSEmptyState } from "@/components/shared/SHMSEmptyState";

type Props = {
  variant: "no-payments" | "no-results";
  onClear?: () => void;
  className?: string;
};

export function PaymentEmptyState({ variant, onClear, className }: Props) {
  const isSearch = variant === "no-results";

  return (
    <SHMSEmptyState
      className={className}
      icon={isSearch ? Search : CreditCard}
      title={isSearch ? "No matching payments" : "No payments recorded"}
      description={
        isSearch
          ? "Adjust your search to find a payment reference or guest."
          : "Record a payment against a reservation to track revenue and outstanding balances."
      }
      actionLabel={isSearch && onClear ? "Clear search" : undefined}
      onAction={onClear}
    />
  );
}
