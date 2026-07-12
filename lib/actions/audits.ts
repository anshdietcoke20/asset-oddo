"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import { notifyMany } from "@/lib/notifications";
import { isCloseable, dedupeAssetIds } from "@/lib/audit-rules";
import type { AuditItemResult } from "@/generated/prisma/client";

export type AuditFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: string }
  | undefined;

const CreateAuditCycleSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    scopeDepartmentId: z.string().trim().optional(),
    scopeLocation: z.string().trim().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export async function createAuditCycle(
  _prevState: AuditFormState,
  formData: FormData,
): Promise<AuditFormState> {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const raw = {
    name: formData.get("name"),
    scopeDepartmentId: formData.get("scopeDepartmentId") || undefined,
    scopeLocation: formData.get("scopeLocation") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  };
  const parsed = CreateAuditCycleSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, scopeDepartmentId, scopeLocation, startDate, endDate } = parsed.data;

  const cycle = await db.auditCycle.create({
    data: {
      name,
      scopeDepartmentId: scopeDepartmentId || null,
      scopeLocation: scopeLocation || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "OPEN",
      createdById: user.id,
    },
  });

  // Auto-generate PENDING audit items for every asset in scope.
  const matchedAssetIds: string[] = [];

  if (scopeDepartmentId) {
    const assets = await db.asset.findMany({
      where: { allocations: { some: { departmentId: scopeDepartmentId, status: "ACTIVE" } } },
      select: { id: true },
    });
    matchedAssetIds.push(...assets.map((a) => a.id));
  }
  if (scopeLocation) {
    const assets = await db.asset.findMany({
      where: { location: scopeLocation },
      select: { id: true },
    });
    matchedAssetIds.push(...assets.map((a) => a.id));
  }
  if (!scopeDepartmentId && !scopeLocation) {
    const assets = await db.asset.findMany({
      where: { status: { notIn: ["RETIRED", "DISPOSED"] } },
      select: { id: true },
    });
    matchedAssetIds.push(...assets.map((a) => a.id));
  }

  const assetIds = dedupeAssetIds(matchedAssetIds);

  if (assetIds.length > 0) {
    await db.auditItem.createMany({
      data: assetIds.map((assetId) => ({ auditCycleId: cycle.id, assetId })),
      skipDuplicates: true,
    });
  }

  await logActivity({
    actorId: user.id,
    action: "AUDIT_CYCLE_CREATED",
    entityType: "AuditCycle",
    entityId: cycle.id,
    metadata: { itemCount: assetIds.length },
  });

  revalidatePath("/audits");
  redirect(`/audits/${cycle.id}`);
}

export async function assignAuditors(
  auditCycleId: string,
  employeeIds: string[],
): Promise<{ error?: string; success?: string }> {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  await db.auditCycleAuditor.deleteMany({ where: { auditCycleId } });
  if (employeeIds.length > 0) {
    await db.auditCycleAuditor.createMany({
      data: employeeIds.map((employeeId) => ({ auditCycleId, employeeId })),
      skipDuplicates: true,
    });
  }

  await logActivity({
    actorId: user.id,
    action: "AUDIT_AUDITORS_ASSIGNED",
    entityType: "AuditCycle",
    entityId: auditCycleId,
    metadata: { employeeIds },
  });

  revalidatePath(`/audits/${auditCycleId}`);
  return { success: "Auditors updated." };
}

export async function verifyAuditItem(
  itemId: string,
  result: Extract<AuditItemResult, "VERIFIED" | "MISSING" | "DAMAGED">,
  notes?: string,
) {
  const user = await requireUser();

  const item = await db.auditItem.findUnique({
    where: { id: itemId },
    include: { auditCycle: { include: { auditors: true } } },
  });
  if (!item) {
    return { error: "Audit item not found." };
  }
  if (item.auditCycle.status === "CLOSED") {
    return { error: "This audit cycle is already closed." };
  }

  const isPrivileged = user.role === "ADMIN" || user.role === "ASSET_MANAGER";
  const isAssignedAuditor = item.auditCycle.auditors.some((a) => a.employeeId === user.id);
  if (!isPrivileged && !isAssignedAuditor) {
    return { error: "You are not assigned as an auditor for this cycle." };
  }

  await db.auditItem.update({
    where: { id: itemId },
    data: {
      result,
      notes: notes?.trim() || null,
      verifiedById: user.id,
      verifiedAt: new Date(),
    },
  });

  await logActivity({
    actorId: user.id,
    action: "AUDIT_ITEM_VERIFIED",
    entityType: "AuditItem",
    entityId: itemId,
    metadata: { result },
  });

  if (result === "MISSING" || result === "DAMAGED") {
    const admins = await db.employee.findMany({ where: { role: "ADMIN" } });
    await notifyMany(
      admins.map((a) => a.id),
      {
        type: "AUDIT_DISCREPANCY_FLAGGED",
        message: `Audit "${item.auditCycle.name}" flagged an asset as ${result.toLowerCase()}.`,
        entityType: "AuditItem",
        entityId: itemId,
      },
    );
  }

  revalidatePath(`/audits/${item.auditCycleId}`);
  return { success: "Saved." };
}

export async function closeAuditCycle(id: string) {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const cycle = await db.auditCycle.findUnique({ where: { id }, include: { items: true } });
  if (!cycle) {
    return { error: "Audit cycle not found." };
  }
  if (cycle.status === "CLOSED") {
    return { error: "This audit cycle is already closed." };
  }
  if (!isCloseable(cycle.items)) {
    return { error: "Cannot close: some audit items are still pending verification." };
  }

  const missingAssetIds = cycle.items.filter((i) => i.result === "MISSING").map((i) => i.assetId);
  const damagedAssetIds = cycle.items.filter((i) => i.result === "DAMAGED").map((i) => i.assetId);

  await db.$transaction([
    db.auditCycle.update({ where: { id }, data: { status: "CLOSED" } }),
    ...(missingAssetIds.length > 0
      ? [db.asset.updateMany({ where: { id: { in: missingAssetIds } }, data: { status: "LOST" } })]
      : []),
    ...(damagedAssetIds.length > 0
      ? [
          db.asset.updateMany({
            where: { id: { in: damagedAssetIds } },
            data: { condition: "DAMAGED" },
          }),
        ]
      : []),
  ]);

  await logActivity({
    actorId: user.id,
    action: "AUDIT_CYCLE_CLOSED",
    entityType: "AuditCycle",
    entityId: id,
    metadata: { missingCount: missingAssetIds.length, damagedCount: damagedAssetIds.length },
  });

  revalidatePath(`/audits/${id}`);
  revalidatePath("/audits");
  return { success: "Audit cycle closed." };
}
