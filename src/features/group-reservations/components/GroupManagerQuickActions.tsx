"use client";

import Link from "next/link";
import {
  BedDouble,
  CreditCard,
  FileText,
  LogIn,
  LogOut,
  Building2,
  Clock,
  Wallet,
  Printer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GroupFinancialSummary } from "@/types/group-reservation";

type Props = {
  groupId: string;
  financial: GroupFinancialSummary | null;
  corporateAccountId: string | null;
  onTabChange: (tab: string) => void;
  canManage?: boolean;
};

export function GroupManagerQuickActions({
  groupId,
  financial,
  corporateAccountId,
  onTabChange,
  canManage,
}: Props) {
  const base = `/dashboard/group-reservations/${groupId}`;

  const actions = [
    {
      label: "Assign Rooms",
      icon: BedDouble,
      onClick: () => onTabChange("reservations"),
    },
    {
      label: "Collect Deposit",
      icon: Wallet,
      href: financial?.masterFolioId
        ? `/dashboard/guest-folio/${financial.masterFolioId}`
        : `${base}?tab=folio`,
    },
    {
      label: "Record Payment",
      icon: CreditCard,
      href: "/dashboard/payments",
    },
    {
      label: "Open Master Folio",
      icon: Wallet,
      href: financial?.masterFolioId
        ? `/dashboard/guest-folio/${financial.masterFolioId}`
        : `${base}?tab=folio`,
    },
    {
      label: "Generate Invoice",
      icon: FileText,
      href: financial?.masterFolioId
        ? `/dashboard/guest-folio/${financial.masterFolioId}`
        : `${base}?tab=invoices`,
    },
    {
      label: "Print Receipt",
      icon: Printer,
      href: `${base}?tab=invoices`,
    },
    {
      label: "Open Timeline",
      icon: Clock,
      onClick: () => onTabChange("timeline"),
    },
    {
      label: "View Company",
      icon: Building2,
      href: corporateAccountId
        ? `/dashboard/corporate-accounts/${corporateAccountId}`
        : undefined,
      hidden: !corporateAccountId,
    },
    {
      label: "View Blocks",
      icon: BedDouble,
      onClick: () => onTabChange("blocks"),
    },
    ...(canManage
      ? [
          { label: "Bulk Check-In", icon: LogIn, onClick: () => onTabChange("reservations") },
          { label: "Bulk Check-Out", icon: LogOut, onClick: () => onTabChange("reservations") },
        ]
      : []),
  ].filter((a) => !("hidden" in a && a.hidden));

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        if ("href" in action && action.href) {
          return (
            <Button key={action.label} size="sm" variant="outline" asChild>
              <Link href={action.href}>
                <Icon className="mr-1.5 h-4 w-4" />
                {action.label}
              </Link>
            </Button>
          );
        }
        return (
          <Button
            key={action.label}
            size="sm"
            variant="outline"
            onClick={"onClick" in action ? action.onClick : undefined}
          >
            <Icon className="mr-1.5 h-4 w-4" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
