"use client";

import Link from "next/link";
import { Building2, Eye } from "lucide-react";

import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CorporateListItem } from "@/features/corporate-accounts/load-corporate-pages";
import type { CorporateAccountAccess } from "@/lib/auth/corporate-account-access";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { useMemo, useState } from "react";

type Props = {
  accounts: CorporateListItem[];
  access: CorporateAccountAccess;
};

export function CorporateAccountsPageContent({ accounts, access }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.companyName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const totalOutstanding = accounts.reduce((s, a) => s + a.outstandingBalance, 0);

  return (
    <PageContainer
      title="Corporate Accounts"
      description={`Company billing profiles at ${siteConfig.name}.`}
      actions={
        access.canCreate ? (
          <Button asChild>
            <Link href="/dashboard/corporate-accounts/new">Add Company</Link>
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Active Companies" value={accounts.length} icon={Building2} />
        <StatCard
          title="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={Building2}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="With Groups"
          value={accounts.filter((a) => a.groupCount > 0).length}
          icon={Building2}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
      </div>

      <Input
        placeholder="Search company name or account number…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No corporate accounts found.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Account #</th>
                <th className="px-4 py-3 text-left font-semibold">Company</th>
                <th className="px-4 py-3 text-left font-semibold">Contact</th>
                <th className="px-4 py-3 text-left font-semibold">Credit Limit</th>
                <th className="px-4 py-3 text-left font-semibold">Outstanding</th>
                <th className="px-4 py-3 text-left font-semibold">Groups</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{a.accountNumber}</td>
                  <td className="px-4 py-3 font-medium">{a.companyName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.billingContactName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {a.creditLimit != null ? formatCurrency(a.creditLimit) : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(a.outstandingBalance)}
                  </td>
                  <td className="px-4 py-3">{a.groupCount}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/corporate-accounts/${a.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
