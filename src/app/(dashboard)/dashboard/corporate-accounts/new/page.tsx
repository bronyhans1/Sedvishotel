"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCorporateAccountAction } from "@/features/corporate-accounts/actions";
import { siteConfig } from "@/config/site";

export default function NewCorporateAccountPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createCorporateAccountAction({
        companyName: String(form.get("companyName") ?? ""),
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
      if (result.success && result.id) {
        router.push(`/dashboard/corporate-accounts/${result.id}`);
      } else if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <PageContainer
      title="Add Corporate Account"
      description={`Create a company billing profile at ${siteConfig.name}.`}
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input id="companyName" name="companyName" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input id="contactName" name="contactName" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input id="creditLimit" name="creditLimit" type="number" min={0} step="0.01" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Billing Address</Label>
              <Input id="address" name="address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Credit Terms</Label>
              <Input id="terms" name="terms" placeholder="Net 30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isPending}>
              Create Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
