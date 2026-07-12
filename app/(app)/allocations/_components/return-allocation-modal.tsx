"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { returnAllocationAction } from "@/lib/actions/allocations";
import { useCloseOnSuccess } from "@/lib/hooks/use-close-on-success";

interface ReturnAllocationModalProps {
  allocationId: string;
  assetName: string;
}

export function ReturnAllocationModal({ allocationId, assetName }: ReturnAllocationModalProps) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState(returnAllocationAction, undefined);
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);
  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <Button variant="secondary-dark" onClick={() => setOpen(true)}>
        Return
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={`Return ${assetName}`}
        description="Record the asset's condition on check-in and free it up for reallocation."
      >
        <form ref={formRef} action={action} className="flex flex-col gap-4">
          <input type="hidden" name="allocationId" value={allocationId} />
          <div>
            <Label htmlFor={`notes-${allocationId}`}>Condition / check-in notes (optional)</Label>
            <Textarea id={`notes-${allocationId}`} name="conditionCheckinNotes" rows={3} />
          </div>
          {state?.error && <p className="text-caption text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="tertiary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Returning…" : "Confirm return"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
