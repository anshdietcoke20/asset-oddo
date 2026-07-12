"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notifications";
import { isValidDepartmentParent } from "@/lib/org-validation";
import { Prisma, type Role } from "@/generated/prisma/client";

export type OrgFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: string }
  | undefined;

const ROLES: Role[] = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"];

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

const DepartmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  headId: z.string().optional(),
  parentDepartmentId: z.string().optional(),
});

export async function upsertDepartmentAction(
  _prevState: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const admin = await requireRole(["ADMIN"]);

  const parsed = DepartmentSchema.safeParse({
    id: formData.get("id")?.toString() || undefined,
    name: formData.get("name")?.toString() ?? "",
    headId: formData.get("headId")?.toString() || undefined,
    parentDepartmentId: formData.get("parentDepartmentId")?.toString() || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { id, name, headId, parentDepartmentId } = parsed.data;

  if (!isValidDepartmentParent(id, parentDepartmentId)) {
    return {
      fieldErrors: { parentDepartmentId: ["A department cannot be its own parent."] },
    };
  }

  const data = {
    name,
    headId: headId || null,
    parentDepartmentId: parentDepartmentId || null,
  };

  const department = id
    ? await db.department.update({ where: { id }, data })
    : await db.department.create({ data });

  await logActivity({
    actorId: admin.id,
    action: id ? "DEPARTMENT_UPDATED" : "DEPARTMENT_CREATED",
    entityType: "Department",
    entityId: department.id,
    metadata: data,
  });

  revalidatePath("/org-setup");
  return { success: id ? "Department updated." : "Department created." };
}

export async function toggleDepartmentStatusAction(id: string) {
  const admin = await requireRole(["ADMIN"]);
  const department = await db.department.findUnique({ where: { id } });
  if (!department) return;

  const status = department.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await db.department.update({ where: { id }, data: { status } });
  await logActivity({
    actorId: admin.id,
    action: "DEPARTMENT_STATUS_TOGGLED",
    entityType: "Department",
    entityId: id,
    metadata: { status },
  });

  revalidatePath("/org-setup");
}

// ---------------------------------------------------------------------------
// Asset categories
// ---------------------------------------------------------------------------

const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  extraFields: z.string().optional(),
});

export async function upsertCategoryAction(
  _prevState: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const admin = await requireRole(["ADMIN"]);

  const parsed = CategorySchema.safeParse({
    id: formData.get("id")?.toString() || undefined,
    name: formData.get("name")?.toString() ?? "",
    extraFields: formData.get("extraFields")?.toString() || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { id, name, extraFields } = parsed.data;

  let parsedExtraFields: Prisma.InputJsonValue | null = null;
  if (extraFields && extraFields.trim().length > 0) {
    try {
      parsedExtraFields = JSON.parse(extraFields);
    } catch {
      return { fieldErrors: { extraFields: ["Must be valid JSON."] } };
    }
  }

  const data = { name, extraFields: parsedExtraFields ?? Prisma.JsonNull };

  try {
    const category = id
      ? await db.assetCategory.update({ where: { id }, data })
      : await db.assetCategory.create({ data });

    await logActivity({
      actorId: admin.id,
      action: id ? "CATEGORY_UPDATED" : "CATEGORY_CREATED",
      entityType: "AssetCategory",
      entityId: category.id,
      metadata: { name },
    });
  } catch {
    return { fieldErrors: { name: ["A category with this name already exists."] } };
  }

  revalidatePath("/org-setup");
  return { success: id ? "Category updated." : "Category created." };
}

// ---------------------------------------------------------------------------
// Employee directory
// ---------------------------------------------------------------------------

export async function updateEmployeeRoleAction(employeeId: string, role: Role) {
  const admin = await requireRole(["ADMIN"]);
  if (!ROLES.includes(role)) return;

  const employee = await db.employee.update({
    where: { id: employeeId },
    data: { role },
  });

  await logActivity({
    actorId: admin.id,
    action: "EMPLOYEE_ROLE_CHANGED",
    entityType: "Employee",
    entityId: employee.id,
    metadata: { role },
  });
  await notify({
    userId: employee.id,
    type: "ROLE_PROMOTED",
    message: `Your role was changed to ${role.replace("_", " ")}.`,
    entityType: "Employee",
    entityId: employee.id,
  });

  revalidatePath("/org-setup");
}

export async function updateEmployeeDepartmentAction(employeeId: string, departmentId: string) {
  const admin = await requireRole(["ADMIN"]);

  const employee = await db.employee.update({
    where: { id: employeeId },
    data: { departmentId: departmentId || null },
  });

  await logActivity({
    actorId: admin.id,
    action: "EMPLOYEE_DEPARTMENT_CHANGED",
    entityType: "Employee",
    entityId: employee.id,
    metadata: { departmentId: departmentId || null },
  });

  revalidatePath("/org-setup");
}

export async function toggleEmployeeStatusAction(employeeId: string) {
  const admin = await requireRole(["ADMIN"]);
  if (employeeId === admin.id) return;

  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return;

  const status = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await db.employee.update({ where: { id: employeeId }, data: { status } });
  await logActivity({
    actorId: admin.id,
    action: "EMPLOYEE_STATUS_TOGGLED",
    entityType: "Employee",
    entityId: employeeId,
    metadata: { status },
  });

  revalidatePath("/org-setup");
}
