"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User,
} from "lucide-react";

import {
  formatRoleLabel,
  getUserDisplayName,
} from "@/lib/auth/current-user-display";
import type { CurrentUser } from "@/lib/auth/current-user.types";
import { SignOutConfirmDialog } from "@/components/layout/SignOutConfirmDialog";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { siteConfig } from "@/config/site";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import type { Notification } from "@/types/notification";

type NavbarProps = {
  user: CurrentUser | null;
  onMenuClick?: () => void;
  notifications?: Notification[];
};

export function Navbar({ user, onMenuClick, notifications = [] }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const displayName = user ? getUserDisplayName(user) : "Staff";

  useEffect(() => {
    setMounted(true);
  }, []);

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <>
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 max-w-[85vw] p-0 [&>button]:right-3 [&>button]:top-3"
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <Sidebar
            permissions={user?.permissions ?? []}
            onNavigate={() => {}}
          />
        </SheetContent>
      </Sheet>

      <div className="hidden min-w-0 lg:block">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {siteConfig.shortName}
        </p>
        <p className="truncate text-sm font-semibold">
          {siteConfig.fullName}
        </p>
      </div>

      <div className="relative mx-auto hidden w-full max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search guests, rooms, reservations..."
          className="pl-9"
          disabled
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          disabled={!mounted}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <NotificationBell notifications={notifications} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 gap-2 rounded-full pl-1 pr-2"
            >
              <StaffAvatar
                fullName={displayName}
                avatarUrl={user?.avatarUrl}
                className="h-8 w-8"
                fallbackClassName="bg-primary text-primary-foreground text-xs"
              />
              <span className="hidden text-sm font-medium sm:inline-block">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                {user && (
                  <>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {formatRoleLabel(user.role)}
                    </p>
                  </>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="flex w-full cursor-pointer items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                setSignOutOpen(true);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    <SignOutConfirmDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  );
}
