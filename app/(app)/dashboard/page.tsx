import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUpcomingReturnWindow } from "@/lib/dashboard";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  ASSET_MANAGER: "Asset Manager",
  DEPARTMENT_HEAD: "Department Head",
  EMPLOYEE: "Employee",
};

const MAINTENANCE_ACTIVE_STATUSES = [
  "PENDING",
  "APPROVED",
  "TECHNICIAN_ASSIGNED",
  "IN_PROGRESS",
] as const;

const QUICK_ACTIONS = [
  { label: "View assets", href: "/assets" },
  { label: "Allocations", href: "/allocations" },
  { label: "Bookings", href: "/bookings" },
  { label: "Maintenance", href: "/maintenance" },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const now = new Date();
  const { to: upcomingReturnBy } = getUpcomingReturnWindow(now);

  const [
    assetsAvailable,
    assetsAllocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns,
  ] = await Promise.all([
    db.asset.count({ where: { status: "AVAILABLE" } }),
    db.asset.count({ where: { status: "ALLOCATED" } }),
    db.maintenanceRequest.count({
      where: { status: { in: [...MAINTENANCE_ACTIVE_STATUSES] } },
    }),
    db.booking.count({
      where: { status: { in: ["UPCOMING", "ONGOING"] }, endTime: { gte: now } },
    }),
    db.transferRequest.count({ where: { status: "REQUESTED" } }),
    db.assetAllocation.count({
      where: { status: "ACTIVE", expectedReturnDate: { gte: now, lte: upcomingReturnBy } },
    }),
    db.assetAllocation.count({
      where: { status: "ACTIVE", expectedReturnDate: { lt: now } },
    }),
  ]);

  const kpis: Array<{ label: string; value: number; danger?: boolean }> = [
    { label: "Assets available", value: assetsAvailable },
    { label: "Assets allocated", value: assetsAllocated },
    { label: "Maintenance today", value: maintenanceToday },
    { label: "Active bookings", value: activeBookings },
    { label: "Pending transfers", value: pendingTransfers },
    { label: "Upcoming returns (7 days)", value: upcomingReturns },
    { label: "Overdue returns", value: overdueReturns, danger: overdueReturns > 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display-sm text-on-dark">Welcome back, {user?.name}</h1>
        <p className="mt-1 text-body-md text-muted">
          Signed in as {user ? ROLE_LABELS[user.role] : ""}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className={cn("text-display-sm", kpi.danger ? "text-danger" : "text-on-dark")}>
              {kpi.value}
            </p>
            <p className="mt-1 text-body-sm text-muted">{kpi.label}</p>
          </Card>
        ))}
      </div>

      <div>
        <p className="mb-2 text-title-sm text-on-dark">Quick actions</p>
        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href} className={buttonVariants("secondary-dark")}>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
