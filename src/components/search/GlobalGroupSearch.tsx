"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { searchGroupsAction } from "@/features/group-reservations/actions";
import type { GroupSearchResult } from "@/lib/group-reservations/search-contract";

export function GlobalGroupSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await searchGroupsAction(query);
        if (result.success) {
          setResults(result.results);
          setOpen(result.results.length > 0);
        }
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative hidden w-full max-w-md md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search groups, companies, guests…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="pl-9"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
          {results.map((r) => (
            <Link
              key={`${r.kind}-${r.id}`}
              href={r.href ?? "#"}
              className="block px-4 py-2 text-sm hover:bg-muted"
            >
              <span className="font-medium">{r.label}</span>
              {r.sublabel && (
                <span className="ml-2 text-muted-foreground">{r.sublabel}</span>
              )}
              <span className="ml-2 text-xs capitalize text-muted-foreground">
                {r.kind}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
