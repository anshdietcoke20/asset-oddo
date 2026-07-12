"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { navItemsForRole } from "@/components/shell/nav-items";
import { cn } from "@/lib/utils";

export function SideNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-hairline-on-dark p-4 md:flex">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-nav-link transition-colors",
              active
                ? "bg-surface-card-dark text-on-dark"
                : "text-muted hover:bg-surface-card-dark/60 hover:text-body",
            )}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
