"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelBookingAction } from "@/lib/actions/bookings";
import { BookingFormModal } from "./booking-form-modal";

interface AssetOption {
  id: string;
  name: string;
  assetTag: string;
}

interface BookingRowActionsProps {
  bookingId: string;
  canManage: boolean;
  status: string;
  assets: AssetOption[];
  initialAssetId: string;
  initialStart: string;
  initialEnd: string;
  initialPurpose: string;
}

export function BookingRowActions({
  bookingId,
  canManage,
  status,
  assets,
  initialAssetId,
  initialStart,
  initialEnd,
  initialPurpose,
}: BookingRowActionsProps) {
  const [pending, startTransition] = useTransition();

  if (!canManage || status === "CANCELLED" || status === "COMPLETED") {
    return <span className="text-caption text-muted">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <BookingFormModal
        mode="reschedule"
        bookingId={bookingId}
        assets={assets}
        initialAssetId={initialAssetId}
        initialStart={initialStart}
        initialEnd={initialEnd}
        initialPurpose={initialPurpose}
        triggerLabel="Reschedule"
        triggerVariant="secondary-dark"
      />
      <Button
        variant="danger"
        disabled={pending}
        onClick={() => startTransition(() => cancelBookingAction(bookingId))}
      >
        {pending ? "Cancelling…" : "Cancel"}
      </Button>
    </div>
  );
}
