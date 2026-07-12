"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTodayDateString } from "@/lib/dates/today";
import { formatCurrency } from "@/lib/utils";
import {
  PRICING_MODE_LABELS,
  PRICING_RULE_STATUS_LABELS,
  ROOM_TYPE_PRESET_MODES,
  type PricingMode,
  type RoomTypePricingPresetForm,
} from "@/types/pricing";

type Props = {
  rackRate: number;
  presets: RoomTypePricingPresetForm[];
  onChange: (presets: RoomTypePricingPresetForm[]) => void;
};

function buildDefaultPresets(
  existing: RoomTypePricingPresetForm[]
): RoomTypePricingPresetForm[] {
  return ROOM_TYPE_PRESET_MODES.map((mode) => {
    const found = existing.find((p) => p.pricingMode === mode);
    return (
      found ?? {
        pricingMode: mode,
        configured: false,
      }
    );
  });
}

export function RoomTypePricingPresetsPanel({
  rackRate,
  presets,
  onChange,
}: Props) {
  const rows = buildDefaultPresets(presets);
  const [editingMode, setEditingMode] = useState<PricingMode | null>(null);

  function updatePreset(
    mode: PricingMode,
    patch: Partial<RoomTypePricingPresetForm>
  ) {
    onChange(
      rows.map((row) =>
        row.pricingMode === mode ? { ...row, ...patch, pricingMode: mode } : row
      )
    );
  }

  return (
    <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
      <div>
        <p className="text-sm font-semibold">Pricing Presets</p>
        <p className="text-xs text-muted-foreground">
          Rack rate is the published default. Configure preset charged rates —
          changes create new rule versions; history is never deleted.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
        <span className="font-medium">Rack Rate (Standard)</span>
        <span className="font-semibold tabular-nums">{formatCurrency(rackRate)}</span>
      </div>

      <div className="space-y-2">
        {rows.map((preset) => {
          const isEditing = editingMode === preset.pricingMode;
          const configured = preset.configured && preset.rate != null;

          return (
            <div
              key={preset.pricingMode}
              className="rounded-lg border bg-background p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {PRICING_MODE_LABELS[preset.pricingMode]}
                  </p>
                  {configured ? (
                    <p className="text-xs text-muted-foreground">
                      Rate {formatCurrency(preset.rate ?? 0)}
                      {preset.effectiveFrom
                        ? ` · From ${preset.effectiveFrom}`
                        : ""}
                      {preset.effectiveTo ? ` · To ${preset.effectiveTo}` : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not configured</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {configured && preset.status ? (
                    <Badge variant="secondary">
                      {PRICING_RULE_STATUS_LABELS[preset.status]}
                    </Badge>
                  ) : null}
                  {configured ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingMode(preset.pricingMode)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updatePreset(preset.pricingMode, {
                            configured: false,
                            rate: undefined,
                            status: "inactive",
                          })
                        }
                      >
                        Disable
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updatePreset(preset.pricingMode, {
                            status: "expired",
                            configured: false,
                          })
                        }
                      >
                        Archive
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditingMode(preset.pricingMode);
                        updatePreset(preset.pricingMode, {
                          configured: true,
                          rate: preset.pricingMode === "complimentary" ? 0 : rackRate,
                          effectiveFrom: getTodayDateString(),
                          effectiveTo: null,
                          status: "active",
                        });
                      }}
                    >
                      Configure
                    </Button>
                  )}
                </div>
              </div>

              {isEditing && configured ? (
                <div className="mt-3 grid gap-3 border-t pt-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Rate (GHS)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={preset.rate ?? ""}
                      onChange={(e) =>
                        updatePreset(preset.pricingMode, {
                          rate: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Effective From</Label>
                    <Input
                      type="date"
                      value={preset.effectiveFrom ?? getTodayDateString()}
                      onChange={(e) =>
                        updatePreset(preset.pricingMode, {
                          effectiveFrom: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Effective To (optional)</Label>
                    <Input
                      type="date"
                      value={preset.effectiveTo ?? ""}
                      onChange={(e) =>
                        updatePreset(preset.pricingMode, {
                          effectiveTo: e.target.value || null,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingMode(null)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
