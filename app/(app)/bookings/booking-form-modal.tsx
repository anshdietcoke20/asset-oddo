"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Input, Label, FieldError, Select, Textarea } from "@/components/ui/input";
import {
  createBookingAction,
  rescheduleBookingAction,
  type BookingFormState,
} from "@/lib/actions/bookings";
import { useCloseOnSuccess } from "@/lib/hooks/use-close-on-success";

interface AssetOption {
  id: string;
  name: string;
  assetTag: string;
}

interface BookingFormModalProps {
  assets: AssetOption[];
  triggerLabel: string;
  triggerVariant?: ButtonVariant;
  mode?: "create" | "reschedule";
  bookingId?: string;
  initialAssetId?: string;
  initialStart?: string;
  initialEnd?: string;
  initialPurpose?: string;
}

export function BookingFormModal({
  assets,
  triggerLabel,
  triggerVariant = "primary",
  mode = "create",
  bookingId,
  initialAssetId,
  initialStart,
  initialEnd,
  initialPurpose,
}: BookingFormModalProps) {
  const [open, setOpen] = useState(false);
  const action = mode === "reschedule" ? rescheduleBookingAction : createBookingAction;
  const [state, formAction, pending] = useActionState<BookingFormState, FormData>(
    action,
    undefined,
  );

  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <Button variant={triggerVariant} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={mode === "reschedule" ? "Reschedule booking" : "New booking"}
        description="Bookings can only be made for shared assets and must not overlap an existing booking for that asset."
      >
        <form action={formAction} className="flex flex-col gap-4">
          {mode === "reschedule" && bookingId && (
            <input type="hidden" name="bookingId" value={bookingId} />
          )}
          <div>
            <Label htmlFor={`${mode}-assetId`}>Asset</Label>
            <Select id={`${mode}-assetId`} name="assetId" defaultValue={initialAssetId ?? ""} required>
              <option value="" disabled>
                Choose an asset
              </option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.assetTag})
                </option>
              ))}
            </Select>
            <FieldError>{state?.fieldErrors?.assetId?.[0]}</FieldError>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${mode}-startTime`}>Start</Label>
              <Input
                id={`${mode}-startTime`}
                name="startTime"
                type="datetime-local"
                defaultValue={initialStart}
                required
              />
              <FieldError>{state?.fieldErrors?.startTime?.[0]}</FieldError>
            </div>
            <div>
              <Label htmlFor={`${mode}-endTime`}>End</Label>
              <Input
                id={`${mode}-endTime`}
                name="endTime"
                type="datetime-local"
                defaultValue={initialEnd}
                required
              />
              <FieldError>{state?.fieldErrors?.endTime?.[0]}</FieldError>
            </div>
          </div>
          <div>
            <Label htmlFor={`${mode}-purpose`}>Purpose</Label>
            <Textarea id={`${mode}-purpose`} name="purpose" defaultValue={initialPurpose} rows={3} />
          </div>
          {state?.error && <p className="text-caption text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="tertiary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : mode === "reschedule" ? "Save changes" : "Create booking"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
