"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Save } from "lucide-react";
import { useTheme } from "next-themes";

import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveSettingsAction, uploadBrandingAssetAction } from "@/features/settings/actions";
import {
  DocumentNumberPreviewPanel,
  DocumentSequenceManager,
} from "@/features/settings/components/DocumentSequencePanel";
import { useToast } from "@/hooks/use-toast";
import type { SettingsAccess } from "@/lib/auth/settings-access";
import { applyBrandingCss } from "@/lib/branding/apply-css";
import { siteConfig } from "@/config/site";
import type { HotelSettings } from "@/types/settings";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
    </label>
  );
}

export function SettingsPageContent({
  settings: initialSettings,
  access,
  isAdmin,
}: {
  settings: HotelSettings;
  access: SettingsAccess;
  isAdmin: boolean;
}) {
  const toast = useToast();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<HotelSettings>(initialSettings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof HotelSettings>(key: K, val: HotelSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: val }));
    setSaved(false);
    if (key === "theme") {
      setTheme(val as HotelSettings["theme"]);
    }
  };

  useEffect(() => {
    applyBrandingCss({
      hotelName: settings.hotelName,
      logoUrl: settings.logoUrl || null,
      faviconUrl: settings.faviconUrl || null,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      theme: settings.theme,
    });
  }, [
    settings.hotelName,
    settings.logoUrl,
    settings.faviconUrl,
    settings.primaryColor,
    settings.secondaryColor,
    settings.theme,
  ]);

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const result = await saveSettingsAction(settings);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setSaved(true);
      toast.celebrate("Settings Updated", "Hotel settings saved successfully.");
      window.setTimeout(() => setSaved(false), 2500);
    });
  };

  const readOnly = !access.canManage;

  function uploadBranding(asset: "logo" | "favicon", file: File) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadBrandingAssetAction(formData, asset);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.url) {
        set(asset === "logo" ? "logoUrl" : "faviconUrl", result.url);
      }
      toast.celebrate("Branding Updated", `${asset === "logo" ? "Logo" : "Favicon"} uploaded.`);
    });
  }

  return (
    <PageContainer
      title="Settings"
      description={`Configure operations for ${siteConfig.name}.`}
      actions={
        access.canManage ? (
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? "Saving Settings…" : saved ? "Saved" : "Save Changes"}
          </Button>
        ) : undefined
      }
    >
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <fieldset disabled={readOnly || isPending} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Hotel Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Hotel Name</Label>
              <Input value={settings.hotelName} onChange={(e) => set("hotelName", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input value={settings.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={settings.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={settings.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={settings.website} onChange={(e) => set("website", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>TIN Number</Label>
              <Input value={settings.tinNumber} onChange={(e) => set("tinNumber", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Hotel Description</Label>
              <Textarea
                rows={3}
                value={settings.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                {settings.logoUrl ? (
                  <Image
                    src={settings.logoUrl}
                    alt="Hotel logo"
                    width={80}
                    height={80}
                    className="mb-2 h-20 w-20 object-contain"
                    unoptimized
                  />
                ) : (
                  <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                )}
                <p className="text-sm font-medium">Hotel Logo</p>
                {access.canManage ? (
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-3 max-w-xs"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBranding("logo", file);
                    }}
                  />
                ) : null}
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                {settings.faviconUrl ? (
                  <Image
                    src={settings.faviconUrl}
                    alt="Favicon"
                    width={32}
                    height={32}
                    className="mb-2 h-8 w-8 object-contain"
                    unoptimized
                  />
                ) : (
                  <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                )}
                <p className="text-sm font-medium">Favicon</p>
                {access.canManage ? (
                  <Input
                    type="file"
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg"
                    className="mt-3 max-w-xs"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBranding("favicon", file);
                    }}
                  />
                ) : null}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-medium">Live Preview</p>
              <p className="mt-1 text-muted-foreground">
                Colors and theme update immediately as you edit. Save to persist across sessions.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" style={{ backgroundColor: settings.primaryColor }}>
                  Primary Button
                </Button>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: settings.secondaryColor }}
                >
                  Badge
                </span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={settings.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="h-9 w-14 p-1" />
                  <Input value={settings.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={settings.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} className="h-9 w-14 p-1" />
                  <Input value={settings.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Theme</Label>
                <select
                  className={selectClass}
                  value={settings.theme}
                  onChange={(e) => set("theme", e.target.value as HotelSettings["theme"])}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Check-In Time</Label>
              <Input type="time" value={settings.checkInTime} onChange={(e) => set("checkInTime", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check-Out Time</Label>
              <Input type="time" value={settings.checkOutTime} onChange={(e) => set("checkOutTime", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label>Late Checkout Policy</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="lateCheckoutPolicyMode"
                    checked={settings.lateCheckoutPolicyMode === "flat"}
                    onChange={() => set("lateCheckoutPolicyMode", "flat")}
                  />
                  Flat Fee
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="lateCheckoutPolicyMode"
                    checked={settings.lateCheckoutPolicyMode === "hour_based"}
                    onChange={() => set("lateCheckoutPolicyMode", "hour_based")}
                  />
                  Hour-Based
                </label>
              </div>
            </div>
            {settings.lateCheckoutPolicyMode === "flat" ? (
              <div className="space-y-2">
                <Label>Late Check-Out Fee (GH₵)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={settings.lateCheckoutFee}
                  onChange={(e) => set("lateCheckoutFee", Number(e.target.value))}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>1–2 Hours Late (GH₵)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={settings.lateCheckoutHourFee1To2}
                    onChange={(e) => set("lateCheckoutHourFee1To2", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>2–4 Hours Late (GH₵)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={settings.lateCheckoutHourFee2To4}
                    onChange={(e) => set("lateCheckoutHourFee2To4", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>4–6 Hours Late (GH₵)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={settings.lateCheckoutHourFee4To6}
                    onChange={(e) => set("lateCheckoutHourFee4To6", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    More than 6 hours late charges the room nightly rate automatically.
                  </p>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Currency Symbol</Label>
              <Input value={settings.currencySymbol} onChange={(e) => set("currencySymbol", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Currency Position</Label>
              <select
                className={selectClass}
                value={settings.currencyPosition}
                onChange={(e) =>
                  set(
                    "currencyPosition",
                    e.target.value === "after" ? "after" : "before"
                  )
                }
              >
                <option value="before">Before amount ({settings.currencySymbol} 100.00)</option>
                <option value="after">After amount (100.00 {settings.currencySymbol})</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Currency Code</Label>
              <Input value={settings.currency} onChange={(e) => set("currency", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time Zone</Label>
              <Input value={settings.timeZone} onChange={(e) => set("timeZone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input type="number" value={settings.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Service Charge (%)</Label>
              <Input type="number" value={settings.serviceCharge} onChange={(e) => set("serviceCharge", Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Invoice Prefix</Label>
              <Input value={settings.invoicePrefix} onChange={(e) => set("invoicePrefix", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Starting Number</Label>
              <Input type="number" min={1} value={settings.invoiceStartingNumber} onChange={(e) => set("invoiceStartingNumber", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Due Days</Label>
              <Input type="number" min={0} value={settings.invoiceDueDays} onChange={(e) => set("invoiceDueDays", Number(e.target.value))} />
            </div>
            <ToggleRow label="Auto Generate Invoice Number" checked={settings.autoGenerateInvoiceNumber} onChange={(v) => set("autoGenerateInvoiceNumber", v)} />
            <div className="space-y-2 sm:col-span-2">
              <DocumentNumberPreviewPanel settings={settings} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Footer Note</Label>
              <Textarea value={settings.invoiceFooter} onChange={(e) => set("invoiceFooter", e.target.value)} rows={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Terms & Conditions</Label>
              <Textarea value={settings.termsAndConditions} onChange={(e) => set("termsAndConditions", e.target.value)} rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receipt Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Receipt Prefix</Label>
              <Input value={settings.receiptPrefix} onChange={(e) => set("receiptPrefix", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Receipt Starting Number</Label>
              <Input type="number" min={1} value={settings.receiptStartingNumber} onChange={(e) => set("receiptStartingNumber", Number(e.target.value))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Receipt Header Message</Label>
              <Input value={settings.receiptHeaderMessage} onChange={(e) => set("receiptHeaderMessage", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Receipt Footer Message</Label>
              <Textarea value={settings.receiptFooterMessage} onChange={(e) => set("receiptFooterMessage", e.target.value)} rows={2} />
            </div>
            <ToggleRow label="Show Hotel Logo" checked={settings.showHotelLogo} onChange={(v) => set("showHotelLogo", v)} />
            <ToggleRow label="Show QR Code" checked={settings.showQrCode} onChange={(v) => set("showQrCode", v)} />
            <ToggleRow label="Print Thank You Message" checked={settings.printThankYouMessage} onChange={(v) => set("printThankYouMessage", v)} />
            <div className="space-y-2 sm:col-span-2">
              <DocumentNumberPreviewPanel settings={settings} />
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Document Sequence Management</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentSequenceManager isAdmin={isAdmin} />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Printing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Paper Size</Label>
              <select
                value={settings.paperSize}
                onChange={(e) => set("paperSize", e.target.value as HotelSettings["paperSize"])}
                className={selectClass}
              >
                <option value="a4">A4</option>
                <option value="thermal_80mm">Thermal 80mm</option>
                <option value="thermal_58mm">Thermal 58mm</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Default Printer Mode</Label>
              <select
                value={settings.defaultPrinterMode}
                onChange={(e) => set("defaultPrinterMode", e.target.value as HotelSettings["defaultPrinterMode"])}
                className={selectClass}
              >
                <option value="browser">Browser Print Dialog</option>
              </select>
            </div>
            <ToggleRow label="Auto Print After Payment" checked={settings.autoPrintAfterPayment} onChange={(v) => set("autoPrintAfterPayment", v)} />
            <ToggleRow label="Ask Before Printing" checked={settings.askBeforePrinting} onChange={(v) => set("askBeforePrinting", v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding & Registration</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Registration Number</Label>
              <Input value={settings.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Reservation Email Template</Label>
              <Textarea value={settings.reservationEmailTemplate} onChange={(e) => set("reservationEmailTemplate", e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Email Template</Label>
              <Textarea value={settings.invoiceEmailTemplate} onChange={(e) => set("invoiceEmailTemplate", e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Reminder Email Template</Label>
              <Textarea value={settings.reminderEmailTemplate} onChange={(e) => set("reminderEmailTemplate", e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ToggleRow label="Email Notifications" checked={settings.emailNotifications} onChange={(v) => set("emailNotifications", v)} />
            <ToggleRow label="SMS Notifications" checked={settings.smsNotifications} onChange={(v) => set("smsNotifications", v)} />
            <ToggleRow label="Payment Alerts" checked={settings.paymentAlerts} onChange={(v) => set("paymentAlerts", v)} />
            <ToggleRow label="Reservation Alerts" checked={settings.reservationAlerts} onChange={(v) => set("reservationAlerts", v)} />
            <ToggleRow label="Housekeeping Alerts" checked={settings.housekeepingAlerts} onChange={(v) => set("housekeepingAlerts", v)} />
          </CardContent>
        </Card>
      </fieldset>
    </PageContainer>
  );
}
