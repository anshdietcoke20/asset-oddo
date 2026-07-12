"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { assignAuditors } from "@/lib/actions/audits";
import { toast } from "@/components/ui/toast";

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

export function AssignAuditorsForm({
  auditCycleId,
  employees,
  initialSelected,
}: {
  auditCycleId: string;
  employees: EmployeeOption[];
  initialSelected: string[];
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set(initialSelected));
  const [pending, startTransition] = React.useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await assignAuditors(auditCycleId, Array.from(selected));
      if (result?.error) {
        toast({ title: "Could not update auditors", description: result.error, tone: "danger" });
      } else {
        toast({ title: "Auditors updated", tone: "success" });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-lg bg-surface-elevated-dark p-3">
        {employees.length === 0 && <p className="text-body-sm text-muted">No employees found.</p>}
        {employees.map((employee) => (
          <label key={employee.id} className="flex cursor-pointer items-center gap-2 text-body-sm text-on-dark">
            <input
              type="checkbox"
              checked={selected.has(employee.id)}
              onChange={() => toggle(employee.id)}
              className="h-4 w-4 rounded"
            />
            {employee.name} <span className="text-muted">({employee.email})</span>
          </label>
        ))}
      </div>
      <Button
        variant="secondary-dark"
        onClick={handleSave}
        disabled={pending}
        className="self-start"
      >
        {pending ? "Saving..." : "Save auditors"}
      </Button>
    </div>
  );
}
