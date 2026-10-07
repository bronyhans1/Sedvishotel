"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCorporateAccountAction } from "@/features/corporate-accounts/actions";
import type { CorporateAccount } from "@/types/corporate-account";

type Props = {
  account: CorporateAccount;
};

export function CorporateAccountEditForm({ account }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const companyName = String(form.get("companyName") ?? "").trim();
    if (!companyName) {
      setError("Company name is required.");
      return;
    }
    startTransition(async () => {
      const result = await updateCorporateAccountAction(account.id, {
        companyName,
        billingContactName: String(form.get("contactName") ?? "") || undefined,
        billingContactEmail: String(form.get("email") ?? "") || undefined,
        billingContactPhone: String(form.get("phone") ?? "") || undefined,
        billingAddress: String(form.get("address") ?? "") || undefined,
        creditLimit: form.get("creditLimit")
          ? Number(form.get("creditLimit"))
          : null,
        creditTerms: String(form.get("terms") ?? "") || undefined,
        notes: String(form.get("notes") ?? "") || undefined,
      });
      if (result.success) {
        router.push(`/dashboard/corporate-accounts/${account.id}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Edit {account.accountNumber}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              name="companyName"
              required
              defaultValue={account.companyName}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={account.billingContactName ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={account.billingContactPhone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={account.billingContactEmail ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                name="creditLimit"
                type="number"
                min={0}
                step="0.01"
                defaultValue={account.creditLimit ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Billing Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={account.billingAddress ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">Credit Terms</Label>
            <Input
              id="terms"
              name="terms"
              defaultValue={account.creditTerms ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={account.notes ?? ""} />
          </div>
          <p className="text-xs text-muted-foreground">
            Account number {account.accountNumber} stays the same.
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => router.push(`/dashboard/corporate-accounts/${account.id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
