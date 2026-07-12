"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Label, FieldError, Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  upsertDepartmentAction,
  toggleDepartmentStatusAction,
  type OrgFormState,
} from "@/lib/actions/org";
import { useCloseOnSuccess } from "@/lib/hooks/use-close-on-success";

export interface DepartmentRow {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  headId: string | null;
  parentDepartmentId: string | null;
  head: { id: string; name: string } | null;
  parentDepartment: { id: string; name: string } | null;
}

export interface EmployeeOption {
  id: string;
  name: string;
}

export function DepartmentsTab({
  departments,
  employees,
}: {
  departments: DepartmentRow[];
  employees: EmployeeOption[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const [state, formAction, isSubmitting] = useActionState<OrgFormState, FormData>(
    upsertDepartmentAction,
    undefined,
  );
  const [isToggling, startToggle] = useTransition();

  useEffect(() => {
    if (state?.success) {
      toast({ title: state.success, tone: "success" });
    }
  }, [state]);
  useCloseOnSuccess(state, () => {
    setModalOpen(false);
    setEditing(null);
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(department: DepartmentRow) {
    setEditing(department);
    setModalOpen(true);
  }

  function handleToggle(id: string) {
    startToggle(async () => {
      await toggleDepartmentStatusAction(id);
      toast({ title: "Department status updated.", tone: "success" });
    });
  }

  const parentOptions = departments.filter((department) => department.id !== editing?.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Departments</CardTitle>
        <Button variant="primary" onClick={openCreate}>
          New department
        </Button>
      </CardHeader>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Head</TableHeadCell>
            <TableHeadCell>Parent</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Actions</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {departments.map((department) => (
            <TableRow key={department.id}>
              <TableCell>{department.name}</TableCell>
              <TableCell>{department.head?.name ?? "—"}</TableCell>
              <TableCell>{department.parentDepartment?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge tone={department.status === "ACTIVE" ? "success" : "neutral"}>
                  {department.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="tertiary" onClick={() => openEdit(department)}>
                    Edit
                  </Button>
                  <Button
                    variant="tertiary"
                    disabled={isToggling}
                    onClick={() => handleToggle(department.id)}
                  >
                    {department.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {departments.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted">
                No departments yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Edit department" : "New department"}
      >
        <form key={editing?.id ?? "new"} action={formAction} className="flex flex-col gap-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div>
            <Label htmlFor="dept-name">Name</Label>
            <Input id="dept-name" name="name" defaultValue={editing?.name} required />
            <FieldError>{state?.fieldErrors?.name?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="dept-head">Head</Label>
            <Select id="dept-head" name="headId" defaultValue={editing?.headId ?? ""}>
              <option value="">No head assigned</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
            <FieldError>{state?.fieldErrors?.headId?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="dept-parent">Parent department</Label>
            <Select
              id="dept-parent"
              name="parentDepartmentId"
              defaultValue={editing?.parentDepartmentId ?? ""}
            >
              <option value="">No parent</option>
              {parentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
            <FieldError>{state?.fieldErrors?.parentDepartmentId?.[0]}</FieldError>
          </div>
          {state?.error && <p className="text-body-sm text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary-dark" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
