"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  ASSET_MANAGER: "Asset Manager",
  DEPARTMENT_HEAD: "Department Head",
  EMPLOYEE: "Employee",
};

export interface TopNavProps {
  user: { name: string; role: string };
  unreadCount?: number;
  onLogout?: () => void | Promise<void>;
}

export function TopNav({ user, unreadCount = 0, onLogout }: TopNavProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-hairline-on-dark bg-canvas-dark px-6">
      <Link href="/dashboard" className="text-title-md text-primary">
        AssetFlow
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/notifications"
          className="relative rounded-md p-2 text-muted hover:text-on-dark"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-on-primary">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1 text-nav-link text-on-dark hover:bg-surface-card-dark",
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated-dark text-caption">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block leading-tight">{user.name}</span>
              <span className="block text-caption text-muted leading-tight">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </span>
            <ChevronDown size={14} className="text-muted" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="min-w-40 rounded-lg border border-hairline-on-dark bg-surface-card-dark p-1 shadow-lg"
            >
              <DropdownMenu.Item
                onSelect={onLogout}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-body-md text-body outline-none hover:bg-surface-elevated-dark"
              >
                <LogOut size={14} />
                Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
