"use client";

import { useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  updateEmployeeRoleAction,
  updateEmployeeDepartmentAction,
  toggleEmployeeStatusAction,
} from "@/lib/actions/org";
import type { Role } from "@/generated/prisma/client";

export interface EmployeeRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  departmentId: string | null;
  department: { id: string; name: string } | null;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

const ROLE_OPTIONS: Role[] = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"];

export function DirectoryTab({
  employees,
  departments,
  currentUserId,
}: {
  employees: EmployeeRow[];
  departments: DepartmentOption[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(employeeId: string, role: Role) {
    startTransition(async () => {
      await updateEmployeeRoleAction(employeeId, role);
      toast({ title: "Role updated.", tone: "success" });
    });
  }

  function handleDepartmentChange(employeeId: string, departmentId: string) {
    startTransition(async () => {
      await updateEmployeeDepartmentAction(employeeId, departmentId);
      toast({ title: "Department updated.", tone: "success" });
    });
  }

  function handleToggleStatus(employeeId: string) {
    startTransition(async () => {
      await toggleEmployeeStatusAction(employeeId);
      toast({ title: "Status updated.", tone: "success" });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Directory</CardTitle>
      </CardHeader>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Email</TableHeadCell>
            <TableHeadCell>Role</TableHeadCell>
            <TableHeadCell>Department</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Actions</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.name}</TableCell>
              <TableCell className="text-muted">{employee.email}</TableCell>
              <TableCell>
                <Select
                  value={employee.role}
                  disabled={isPending}
                  onChange={(event) =>
                    handleRoleChange(employee.id, event.target.value as Role)
                  }
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={employee.departmentId ?? ""}
                  disabled={isPending}
                  onChange={(event) => handleDepartmentChange(employee.id, event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Select>
              </TableCell>
              <TableCell>
                <Badge tone={employee.status === "ACTIVE" ? "success" : "neutral"}>
                  {employee.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="tertiary"
                  disabled={isPending || employee.id === currentUserId}
                  onClick={() => handleToggleStatus(employee.id)}
                >
                  {employee.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted">
                No employees yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
