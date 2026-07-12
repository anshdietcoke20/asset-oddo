"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Select } from "@/components/ui/input";
import { allocateAssetAction } from "@/lib/actions/allocations";
import { useCloseOnSuccess } from "@/lib/hooks/use-close-on-success";

interface AllocateAssetModalProps {
  assets: { id: string; name: string; assetTag: string }[];
  employees: { id: string; name: string; email: string }[];
  departments: { id: string; name: string }[];
}

export function AllocateAssetModal({ assets, employees, departments }: AllocateAssetModalProps) {
  const [open, setOpen] = React.useState(false);
  const [targetType, setTargetType] = React.useState<"employee" | "department">("employee");
  const [state, action, pending] = useActionState(allocateAssetAction, undefined);
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
      <Button variant="primary" onClick={() => setOpen(true)} disabled={assets.length === 0}>
        Allocate asset
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Allocate asset"
        description="Assign an available asset to an employee or department."
      >
        <form ref={formRef} action={action} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="assetId">Asset</Label>
            <Select id="assetId" name="assetId" required defaultValue="">
              <option value="" disabled>
                Select an available asset
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
            <Label htmlFor="targetType">Allocate to</Label>
            <Select
              id="targetType"
              name="targetType"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as "employee" | "department")}
            >
              <option value="employee">Employee</option>
              <option value="department">Department</option>
            </Select>
          </div>

          {targetType === "employee" ? (
            <div>
              <Label htmlFor="targetId">Employee</Label>
              <Select id="targetId" name="targetId" required defaultValue="">
                <option value="" disabled>
                  Select an employee
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </Select>
              <FieldError>{state?.fieldErrors?.targetId?.[0]}</FieldError>
            </div>
          ) : (
            <div>
              <Label htmlFor="targetId">Department</Label>
              <Select id="targetId" name="targetId" required defaultValue="">
                <option value="" disabled>
                  Select a department
                </option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
              <FieldError>{state?.fieldErrors?.targetId?.[0]}</FieldError>
            </div>
          )}

          <div>
            <Label htmlFor="expectedReturnDate">Expected return date (optional)</Label>
            <Input id="expectedReturnDate" name="expectedReturnDate" type="date" />
          </div>

          {state?.error && <p className="text-caption text-danger">{state.error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="tertiary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Allocating…" : "Allocate asset"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
