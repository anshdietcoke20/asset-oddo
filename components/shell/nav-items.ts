import type { Role } from "@/generated/prisma/client";
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

const ALL_ROLES: Role[] = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"];

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
  { label: "Assets", href: "/assets", icon: Boxes, roles: ALL_ROLES },
  {
    label: "Allocations",
    href: "/allocations",
    icon: ArrowLeftRight,
    roles: ALL_ROLES,
  },
  { label: "Bookings", href: "/bookings", icon: CalendarClock, roles: ALL_ROLES },
  { label: "Maintenance", href: "/maintenance", icon: Wrench, roles: ALL_ROLES },
  {
    label: "Audits",
    href: "/audits",
    icon: ClipboardCheck,
    roles: ["ADMIN", "ASSET_MANAGER"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"],
  },
  { label: "Notifications", href: "/notifications", icon: Bell, roles: ALL_ROLES },
  {
    label: "Organization Setup",
    href: "/org-setup",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
