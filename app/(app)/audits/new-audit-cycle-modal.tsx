"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, FieldError, Select } from "@/components/ui/input";
import { createAuditCycle, type AuditFormState } from "@/lib/actions/audits";

interface DepartmentOption {
  id: string;
  name: string;
}

export function NewAuditCycleModal({ departments }: { departments: DepartmentOption[] }) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState<AuditFormState, FormData>(
    createAuditCycle,
    undefined,
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>New audit cycle</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="New audit cycle"
        description="Audit items are generated automatically for every asset in scope."
      >
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Q3 2026 Headquarters Audit" />
            <FieldError>{state?.fieldErrors?.name?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="scopeDepartmentId">Scope department (optional)</Label>
            <Select id="scopeDepartmentId" name="scopeDepartmentId" defaultValue="">
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="scopeLocation">Scope location (optional)</Label>
            <Input id="scopeLocation" name="scopeLocation" placeholder="e.g. Building A, Floor 2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" />
              <FieldError>{state?.fieldErrors?.startDate?.[0]}</FieldError>
            </div>
            <div>
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" />
              <FieldError>{state?.fieldErrors?.endDate?.[0]}</FieldError>
            </div>
          </div>
          {state?.error && <p className="text-body-sm text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Creating..." : "Create audit cycle"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
