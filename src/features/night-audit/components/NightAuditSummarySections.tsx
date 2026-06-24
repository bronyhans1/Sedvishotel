import {
  BedDouble,
  LogIn,
  LogOut,
  Hotel,
  Wallet,
  Banknote,
  Smartphone,
  CreditCard,
  Landmark,
  CircleDollarSign,
} from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { NightAuditSnapshot } from "@/types/night-audit";

type NightAuditSummarySectionsProps = {
  snapshot: NightAuditSnapshot;
};

export function NightAuditSummarySections({ snapshot }: NightAuditSummarySectionsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Rooms Occupied"
          value={snapshot.roomsOccupied}
          icon={BedDouble}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Rooms Available"
          value={snapshot.roomsAvailable}
          icon={BedDouble}
        />
        <StatCard
          title="Rooms Cleaning"
          value={snapshot.roomsCleaning}
          icon={BedDouble}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="Rooms Maintenance"
          value={snapshot.roomsMaintenance}
          icon={BedDouble}
          iconClassName="bg-red-500/10 text-red-600"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Check-ins" value={snapshot.checkIns} icon={LogIn} />
        <StatCard title="Check-outs" value={snapshot.checkOuts} icon={LogOut} />
        <StatCard title="Active Stays" value={snapshot.activeStays} icon={Hotel} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gross Revenue</span>
              <span className="font-semibold">{formatCurrency(snapshot.grossRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Refunds</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(snapshot.refundTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-medium">Net Revenue</span>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(snapshot.netRevenue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PaymentRow icon={Banknote} label="Cash" value={snapshot.cashTotal} />
            <PaymentRow
              icon={Smartphone}
              label="Mobile Money"
              value={snapshot.mobileMoneyTotal}
            />
            <PaymentRow icon={CreditCard} label="Card" value={snapshot.cardTotal} />
            <PaymentRow
              icon={Landmark}
              label="Bank Transfer"
              value={snapshot.bankTransferTotal}
            />
            {snapshot.otherTotal > 0 ? (
              <PaymentRow icon={Wallet} label="Other" value={snapshot.otherTotal} />
            ) : null}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="flex items-center gap-2 font-medium">
                <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                Net Revenue
              </span>
              <span className="font-bold">{formatCurrency(snapshot.netRevenue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PaymentRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="font-medium">{formatCurrency(value)}</span>
    </div>
  );
}
