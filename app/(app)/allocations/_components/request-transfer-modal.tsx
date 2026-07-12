"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label, Select, FieldError } from "@/components/ui/input";
import { requestTransferAction } from "@/lib/actions/allocations";
import { useCloseOnSuccess } from "@/lib/hooks/use-close-on-success";

interface RequestTransferModalProps {
  allocationId: string;
  assetName: string;
  employees: { id: string; name: string; email: string }[];
  departments: { id: string; name: string }[];
}

export function RequestTransferModal({
  allocationId,
  assetName,
  employees,
  departments,
}: RequestTransferModalProps) {
  const [open, setOpen] = React.useState(false);
  const [targetType, setTargetType] = React.useState<"employee" | "department">("employee");
  const [state, action, pending] = useActionState(requestTransferAction, undefined);
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
      <Button variant="tertiary" onClick={() => setOpen(true)}>
        Request transfer
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={`Request transfer — ${assetName}`}
        description="Submit a request to move this asset to a new holder. An asset manager will approve or reject it."
      >
        <form ref={formRef} action={action} className="flex flex-col gap-4">
          <input type="hidden" name="allocationId" value={allocationId} />
          <div>
            <Label htmlFor={`transfer-target-type-${allocationId}`}>Transfer to</Label>
            <Select
              id={`transfer-target-type-${allocationId}`}
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
              <Label htmlFor={`transfer-target-${allocationId}`}>Employee</Label>
              <Select id={`transfer-target-${allocationId}`} name="targetId" required defaultValue="">
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
              <Label htmlFor={`transfer-target-${allocationId}`}>Department</Label>
              <Select id={`transfer-target-${allocationId}`} name="targetId" required defaultValue="">
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
          {state?.error && <p className="text-caption text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="tertiary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
