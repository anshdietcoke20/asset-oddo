import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { syncBookingStatuses } from "@/lib/actions/bookings";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { AssetFilter } from "./asset-filter";
import { BookingFormModal } from "./booking-form-modal";
import { BookingRowActions } from "./booking-row-actions";
import { toDatetimeLocalValue, formatDateHeading, formatTime } from "./booking-utils";

const STATUS_TONE: Record<string, BadgeTone> = {
  UPCOMING: "info",
  ONGOING: "success",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ assetId?: string }>;
}) {
  const user = await requireUser();
  const { assetId } = await searchParams;

  const assets = await db.asset.findMany({
    where: { isShared: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, assetTag: true },
  });

  const selectedAssetId = assetId && assets.some((asset) => asset.id === assetId) ? assetId : undefined;

  const rawBookings = await db.booking.findMany({
    where: selectedAssetId
      ? { assetId: selectedAssetId, asset: { isShared: true } }
      : { asset: { isShared: true } },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      bookedBy: { select: { id: true, name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const bookings = await syncBookingStatuses(rawBookings);

  const canManageAll = user.role === "ADMIN" || user.role === "ASSET_MANAGER";

  const groups = new Map<string, typeof bookings>();
  for (const booking of bookings) {
    const key = booking.startTime.toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(booking);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-display-sm text-on-dark">Bookings</h1>
          <p className="mt-1 text-body-md text-muted">
            Reserve shared assets and track upcoming, ongoing, and past bookings.
          </p>
        </div>
        <BookingFormModal assets={assets} initialAssetId={selectedAssetId} triggerLabel="New booking" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by asset</CardTitle>
        </CardHeader>
        <AssetFilter assets={assets} selectedAssetId={selectedAssetId} />
      </Card>

      {assets.length === 0 && (
        <Card>
          <p className="text-body-md text-muted">
            No shared/bookable assets yet. Mark an asset as shared to enable booking.
          </p>
        </Card>
      )}

      {assets.length > 0 && bookings.length === 0 && (
        <Card>
          <p className="text-body-md text-muted">
            No bookings found{selectedAssetId ? " for this asset" : ""}.
          </p>
        </Card>
      )}

      {[...groups.entries()].map(([dateKey, dayBookings]) => (
        <Card key={dateKey}>
          <CardHeader>
            <CardTitle>{formatDateHeading(dayBookings[0].startTime)}</CardTitle>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Asset</TableHeadCell>
                <TableHeadCell>Booked by</TableHeadCell>
                <TableHeadCell>Start</TableHeadCell>
                <TableHeadCell>End</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Purpose</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dayBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    {booking.asset.name}{" "}
                    <span className="text-caption text-muted">({booking.asset.assetTag})</span>
                  </TableCell>
                  <TableCell>{booking.bookedBy.name}</TableCell>
                  <TableCell>{formatTime(booking.startTime)}</TableCell>
                  <TableCell>{formatTime(booking.endTime)}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[booking.status] ?? "neutral"}>{booking.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate">{booking.purpose || "—"}</TableCell>
                  <TableCell>
                    <BookingRowActions
                      bookingId={booking.id}
                      canManage={canManageAll || booking.bookedById === user.id}
                      status={booking.status}
                      assets={assets}
                      initialAssetId={booking.asset.id}
                      initialStart={toDatetimeLocalValue(booking.startTime)}
                      initialEnd={toDatetimeLocalValue(booking.endTime)}
                      initialPurpose={booking.purpose ?? ""}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  );
}
