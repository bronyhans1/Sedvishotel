"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGuestAction, searchGuestsAction } from "@/features/guests/actions";
import {
  placeholderGuestLabel,
  type AssignableGuest,
} from "@/lib/group-reservations/guest-identity";

type Props = {
  disabled: boolean;
  selected: AssignableGuest | null;
  onSelect: (guest: AssignableGuest) => void;
  onClear: () => void;
};

const EMPTY_GUEST_FORM = {
  fullName: "",
  phone: "",
  email: "",
  nationality: "",
  idType: "other" as const,
  idNumber: "",
  address: "",
  vipStatus: false,
  notes: "",
};

export function GroupSlotGuestField({ disabled, selected, onSelect, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssignableGuest[]>([]);
  const [searchError, setSearchError] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingGuest, setSavingGuest] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (selected || creating) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError("");
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void searchGuestsAction(trimmed).then((result) => {
        if (cancelled) return;
        if (!result.success) {
          setResults([]);
          setSearchError(result.error);
          return;
        }
        setSearchError("");
        setResults(result.guests);
      });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [creating, query, selected]);

  async function saveGuest() {
    if (savingGuest || disabled) return;
    setCreateError("");
    setSavingGuest(true);
    try {
      const result = await createGuestAction({
        ...EMPTY_GUEST_FORM,
        fullName,
        phone,
        email,
      });
      if (!result.success || !result.id) {
        setCreateError(
          result.success ? "Guest creation failed. Please try again." : result.error
        );
        return;
      }
      onSelect({
        id: result.id,
        fullName: result.fullName || fullName.trim(),
        phone: result.phone || phone.trim(),
        email: result.email || email.trim(),
      });
      setCreating(false);
      setFullName("");
      setPhone("");
      setEmail("");
      setQuery("");
      setResults([]);
    } finally {
      setSavingGuest(false);
    }
  }

  if (selected) {
    return (
      <div className="flex min-w-[180px] items-center justify-between gap-2">
        <span className="text-sm">{selected.fullName}</span>
        <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={onClear}>
          Clear
        </Button>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="flex min-w-[220px] flex-col gap-2">
        <Input
          value={fullName}
          disabled={disabled || savingGuest}
          placeholder="Guest name"
          aria-label="New guest name"
          className="h-8"
          onChange={(event) => setFullName(event.target.value)}
        />
        <Input
          value={phone}
          disabled={disabled || savingGuest}
          placeholder="Phone"
          aria-label="New guest phone"
          className="h-8"
          onChange={(event) => setPhone(event.target.value)}
        />
        <Input
          value={email}
          disabled={disabled || savingGuest}
          placeholder="Email"
          aria-label="New guest email"
          className="h-8"
          onChange={(event) => setEmail(event.target.value)}
        />
        {createError ? <p className="text-xs text-destructive">{createError}</p> : null}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={disabled || savingGuest || !fullName.trim()}
            onClick={() => void saveGuest()}
          >
            {savingGuest ? "Saving…" : "Save guest"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled || savingGuest}
            onClick={() => {
              setCreating(false);
              setCreateError("");
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-[200px]">
      <p className="mb-1 text-xs text-muted-foreground">{placeholderGuestLabel(null)}</p>
      <Input
        value={query}
        disabled={disabled}
        placeholder="Search guest…"
        aria-label="Search guest"
        className="h-8"
        onChange={(event) => setQuery(event.target.value)}
      />
      {searchError ? <p className="mt-1 text-xs text-destructive">{searchError}</p> : null}
      {results.length > 0 ? (
        <div className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-background shadow-md">
          {results.map((guest) => (
            <button
              key={guest.id}
              type="button"
              className="block w-full px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelect(guest);
                setQuery("");
                setResults([]);
              }}
            >
              {guest.fullName}
              {guest.phone ? (
                <span className="ml-2 text-xs text-muted-foreground">{guest.phone}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="mt-1 h-7 px-2"
        disabled={disabled}
        onClick={() => setCreating(true)}
      >
        + Add New Guest
      </Button>
    </div>
  );
}
