import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import type { BadgeTone } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssetStatus } from "@/generated/prisma/client";

const STATUS_BADGE_TONE: Record<AssetStatus, BadgeTone> = {
  AVAILABLE: "success",
  ALLOCATED: "info",
  RESERVED: "warning",
  UNDER_MAINTENANCE: "warning",
  LOST: "danger",
  RETIRED: "neutral",
  DISPOSED: "neutral",
};

const MAINTENANCE_BADGE_TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  TECHNICIAN_ASSIGNED: "info",
  IN_PROGRESS: "info",
  RESOLVED: "success",
};

const ALLOCATION_BADGE_TONE: Record<string, BadgeTone> = {
  ACTIVE: "info",
  RETURNED: "neutral",
};

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function formatCurrency(value: unknown) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

interface AssetDetailPageProps {
  params: Promise<{ id: string }>;
}

type TimelineEntry = {
  date: Date;
  kind: "allocation" | "maintenance";
  title: string;
  status: string;
  badgeTone: BadgeTone;
  detail?: string;
};

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  await requireUser();
  const { id } = await params;

  const asset = await db.asset.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!asset) notFound();

  const [allocations, maintenanceRequests] = await Promise.all([
    db.assetAllocation.findMany({
      where: { assetId: id },
      include: { employee: true, department: true },
      orderBy: { allocatedAt: "desc" },
    }),
    db.maintenanceRequest.findMany({
      where: { assetId: id },
      include: { raisedBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const timeline: TimelineEntry[] = [
    ...allocations.map((alloc): TimelineEntry => ({
      date: alloc.allocatedAt,
      kind: "allocation",
      title: `Allocated to ${alloc.employee?.name ?? alloc.department?.name ?? "Unknown"}`,
      status: alloc.status,
      badgeTone: ALLOCATION_BADGE_TONE[alloc.status] ?? "neutral",
      detail: alloc.returnedAt
        ? `Returned ${formatDate(alloc.returnedAt)}`
        : alloc.expectedReturnDate
          ? `Expected return ${formatDate(alloc.expectedReturnDate)}`
          : undefined,
    })),
    ...maintenanceRequests.map((req): TimelineEntry => ({
      date: req.createdAt,
      kind: "maintenance",
      title: `Maintenance raised by ${req.raisedBy.name}`,
      status: req.status,
      badgeTone: MAINTENANCE_BADGE_TONE[req.status] ?? "neutral",
      detail: req.issueDescription,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/assets" className="text-caption text-muted hover:text-primary">
          ← Back to assets
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-display-sm text-on-dark">{asset.name}</h1>
          <Badge tone={STATUS_BADGE_TONE[asset.status]}>{asset.status.replaceAll("_", " ")}</Badge>
        </div>
        <p className="mt-1 text-body-md text-muted">{asset.assetTag}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset details</CardTitle>
        </CardHeader>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
          <div>
            <dt className="text-caption text-muted">Category</dt>
            <dd className="text-body-md text-on-dark">{asset.category.name}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Serial number</dt>
            <dd className="text-body-md text-on-dark">{asset.serialNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Condition</dt>
            <dd className="text-body-md text-on-dark">{asset.condition}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Location</dt>
            <dd className="text-body-md text-on-dark">{asset.location ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Acquisition date</dt>
            <dd className="text-body-md text-on-dark">{formatDate(asset.acquisitionDate)}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Acquisition cost</dt>
            <dd className="text-body-md text-on-dark">{formatCurrency(asset.acquisitionCost)}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">Shared asset</dt>
            <dd className="text-body-md text-on-dark">{asset.isShared ? "Yes" : "No"}</dd>
          </div>
        </dl>
        {asset.photos.length > 0 && (
          <div className="mt-4">
            <dt className="mb-1 text-caption text-muted">Photos</dt>
            <ul className="flex flex-wrap gap-2 text-body-sm">
              {asset.photos.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <div className="flex flex-col divide-y divide-hairline-on-dark">
          {timeline.length === 0 && (
            <p className="py-3 text-body-md text-muted">No allocation or maintenance history yet.</p>
          )}
          {timeline.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-body-md text-on-dark">{entry.title}</p>
                {entry.detail && <p className="text-caption text-muted">{entry.detail}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={entry.badgeTone}>{entry.status.replaceAll("_", " ")}</Badge>
                <span className="whitespace-nowrap text-caption text-muted">
                  {formatDate(entry.date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
