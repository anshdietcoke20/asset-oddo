"use client";

import { useActionState, useState } from "react";
import { raiseMaintenanceRequest } from "@/lib/actions/maintenance";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Select, Textarea } from "@/components/ui/input";
import { useCloseOnSuccess } from "@/lib/hooks/use-close-on-success";

export interface AssetOption {
  id: string;
  name: string;
  assetTag: string;
}

export function RaiseRequestModal({ assets }: { assets: AssetOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(raiseMaintenanceRequest, undefined);

  useCloseOnSuccess(state, () => setOpen(false));

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Raise request
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Raise maintenance request"
        description="Flag an issue with an asset so the asset manager can review it."
      >
        <form action={action} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="assetId">Asset</Label>
            <Select id="assetId" name="assetId" defaultValue="" required>
              <option value="" disabled>
                Select an asset
              </option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetTag} — {asset.name}
                </option>
              ))}
            </Select>
            <FieldError>{state?.fieldErrors?.assetId?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="issueDescription">Issue description</Label>
            <Textarea
              id="issueDescription"
              name="issueDescription"
              rows={4}
              placeholder="Describe what's wrong with the asset…"
              required
            />
            <FieldError>{state?.fieldErrors?.issueDescription?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" name="priority" defaultValue="MEDIUM" required>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
            <FieldError>{state?.fieldErrors?.priority?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="photoUrl">Photo URL (optional)</Label>
            <Input id="photoUrl" name="photoUrl" placeholder="https://…" />
            <FieldError>{state?.fieldErrors?.photoUrl?.[0]}</FieldError>
          </div>
          {state?.error && <p className="text-caption text-danger">{state.error}</p>}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
