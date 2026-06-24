"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { filterNavigation } from "@/lib/navigation/filter-navigation";
import type { NavItem } from "@/config/navigation";
import { HotelLogo } from "@/components/branding/HotelLogo";
import { useBranding } from "@/components/branding/BrandingProvider";
import { siteConfig } from "@/config/site";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

type SidebarProps = {
  onNavigate?: () => void;
  className?: string;
  /** Live permission codes — sidebar is filtered by module.view. */
  permissions?: string[];
  /** Pre-filtered items (optional; computed from permissions when omitted). */
  items?: NavItem[];
};

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isParentActive(
  pathname: string,
  children: { href: string }[]
): boolean {
  return children.some((c) => isNavItemActive(pathname, c.href));
}

export function Sidebar({
  onNavigate,
  className,
  permissions = [],
  items,
}: SidebarProps) {
  const pathname = usePathname();
  const branding = useBranding();
  const hotelName = branding?.hotelName ?? siteConfig.name;

  const navigation = useMemo(
    () => items ?? filterNavigation(permissions),
    [items, permissions]
  );

  const initialOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const item of navigation) {
      if (item.children?.length) {
        open[item.title] = isParentActive(pathname, item.children);
      }
    }
    return open;
  }, [pathname, navigation]);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(initialOpen);

  let lastSection = "";

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <HotelLogo iconClassName="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-wide">{hotelName}</p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            {siteConfig.shortName}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
          Main
        </p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const showSection =
            item.section && item.section !== lastSection;
          if (showSection && item.section) {
            lastSection = item.section;
          }

          const parentActive =
            item.children?.length &&
            isParentActive(pathname, item.children);
          const isOpen = openMenus[item.title] ?? false;

          return (
            <div key={item.title}>
              {showSection && (
                <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50 first:mt-0">
                  {item.section}
                </p>
              )}

              {item.children?.length ? (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      parentActive
                        ? "bg-sidebar-accent/80 text-white"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.title}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => onNavigate?.()}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isNavItemActive(pathname, child.href)
                              ? "bg-sidebar-accent text-white"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white"
                          )}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.disabled ? "#" : (item.href ?? "#")}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                      return;
                    }
                    onNavigate?.();
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    item.href && isNavItemActive(pathname, item.href)
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
                    item.disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.title}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium">Property Status</span>
            <StatusBadge status="live" label="Live" />
          </div>
          <p className="text-xs text-sidebar-foreground/60">
            {hotelName} · Live Property
          </p>
        </div>
      </div>
    </aside>
  );
}
