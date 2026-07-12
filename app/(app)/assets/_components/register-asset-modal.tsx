"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Select } from "@/components/ui/input";
import { registerAssetAction } from "@/lib/actions/assets";
import { useCloseOnSuccess } from "@/lib/hooks/use-close-on-success";

interface RegisterAssetModalProps {
  categories: { id: string; name: string }[];
}

const CONDITION_OPTIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"] as const;

export function RegisterAssetModal({ categories }: RegisterAssetModalProps) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState(registerAssetAction, undefined);
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
      <Button variant="primary" onClick={() => setOpen(true)}>
        Register asset
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Register asset"
        description="Add a new asset to the registry. The asset tag is generated automatically."
      >
        <form ref={formRef} action={action} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
            <FieldError>{state?.fieldErrors?.name?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Select id="categoryId" name="categoryId" required defaultValue="">
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <FieldError>{state?.fieldErrors?.categoryId?.[0]}</FieldError>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serialNumber">Serial number</Label>
              <Input id="serialNumber" name="serialNumber" />
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select id="condition" name="condition" defaultValue="GOOD">
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="acquisitionDate">Acquisition date</Label>
              <Input id="acquisitionDate" name="acquisitionDate" type="date" />
            </div>
            <div>
              <Label htmlFor="acquisitionCost">Acquisition cost</Label>
              <Input id="acquisitionCost" name="acquisitionCost" type="number" step="0.01" />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" />
          </div>
          <div>
            <Label htmlFor="photos">Photo URLs</Label>
            <Input id="photos" name="photos" placeholder="https://…, https://…" />
          </div>
          <label className="flex items-center gap-2 text-body-sm text-muted">
            <input type="checkbox" name="isShared" className="size-4" />
            Shared asset
          </label>
          {state?.error && <p className="text-caption text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="tertiary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Registering…" : "Register asset"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
