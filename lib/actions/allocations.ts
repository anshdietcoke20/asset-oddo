"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notifications";
import { canAllocate } from "@/lib/allocation-guard";

export type AllocationFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: string }
  | undefined;

const ALLOCATIONS_PATH = "/allocations";

const AllocateAssetSchema = z
  .object({
    assetId: z.string().min(1, "Choose an asset"),
    targetType: z.enum(["employee", "department"]),
    targetId: z.string().min(1, "Choose who this is allocated to"),
    expectedReturnDate: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
  }));

export async function allocateAssetAction(
  _prevState: AllocationFormState,
  formData: FormData,
): Promise<AllocationFormState> {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const parsed = AllocateAssetSchema.safeParse({
    assetId: formData.get("assetId"),
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    expectedReturnDate: formData.get("expectedReturnDate") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { assetId, targetType, targetId, expectedReturnDate } = parsed.data;
  const employeeId = targetType === "employee" ? targetId : null;
  const departmentId = targetType === "department" ? targetId : null;

  const result = await db.$transaction(async (tx) => {
    const asset = await tx.asset.findUnique({ where: { id: assetId } });
    if (!asset || !canAllocate(asset.status)) {
      return { error: "Asset is currently unavailable." as const };
    }

    const allocation = await tx.assetAllocation.create({
      data: {
        assetId,
        employeeId,
        departmentId,
        expectedReturnDate,
      },
    });
    await tx.asset.update({ where: { id: assetId }, data: { status: "ALLOCATED" } });

    return { allocation };
  });

  if ("error" in result) {
    return { error: result.error };
  }

  await logActivity({
    actorId: user.id,
    action: "ASSET_ALLOCATED",
    entityType: "AssetAllocation",
    entityId: result.allocation.id,
    metadata: { assetId, employeeId, departmentId },
  });

  if (employeeId) {
    await notify({
      userId: employeeId,
      type: "ASSET_ASSIGNED",
      message: "An asset has been allocated to you.",
      entityType: "Asset",
      entityId: assetId,
    });
  }

  revalidatePath(ALLOCATIONS_PATH);
  return { success: "Asset allocated." };
}

const ReturnAllocationSchema = z.object({
  allocationId: z.string().min(1),
  conditionCheckinNotes: z.string().optional(),
});

export async function returnAllocationAction(
  _prevState: AllocationFormState,
  formData: FormData,
): Promise<AllocationFormState> {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const parsed = ReturnAllocationSchema.safeParse({
    allocationId: formData.get("allocationId"),
    conditionCheckinNotes: formData.get("conditionCheckinNotes") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { allocationId, conditionCheckinNotes } = parsed.data;

  const result = await db.$transaction(async (tx) => {
    const allocation = await tx.assetAllocation.findUnique({ where: { id: allocationId } });
    if (!allocation || allocation.status !== "ACTIVE") {
      return { error: "This allocation is no longer active." as const };
    }

    await tx.assetAllocation.update({
      where: { id: allocationId },
      data: {
        status: "RETURNED",
        returnedAt: new Date(),
        conditionCheckinNotes: conditionCheckinNotes || null,
      },
    });
    await tx.asset.update({ where: { id: allocation.assetId }, data: { status: "AVAILABLE" } });

    return { allocation };
  });

  if ("error" in result) {
    return { error: result.error };
  }

  await logActivity({
    actorId: user.id,
    action: "ASSET_RETURNED",
    entityType: "AssetAllocation",
    entityId: allocationId,
    metadata: { assetId: result.allocation.assetId },
  });

  revalidatePath(ALLOCATIONS_PATH);
  return { success: "Asset marked as returned." };
}

const RequestTransferSchema = z.object({
  allocationId: z.string().min(1),
  targetType: z.enum(["employee", "department"]),
  targetId: z.string().min(1, "Choose a transfer target"),
});

export async function requestTransferAction(
  _prevState: AllocationFormState,
  formData: FormData,
): Promise<AllocationFormState> {
  const user = await requireUser();

  const parsed = RequestTransferSchema.safeParse({
    allocationId: formData.get("allocationId"),
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { allocationId, targetType, targetId } = parsed.data;

  const allocation = await db.assetAllocation.findUnique({ where: { id: allocationId } });
  if (!allocation || allocation.status !== "ACTIVE") {
    return { error: "This allocation is no longer active." };
  }

  const transfer = await db.transferRequest.create({
    data: {
      assetId: allocation.assetId,
      requestedById: user.id,
      toEmployeeId: targetType === "employee" ? targetId : null,
      toDepartmentId: targetType === "department" ? targetId : null,
      status: "REQUESTED",
    },
  });

  await logActivity({
    actorId: user.id,
    action: "TRANSFER_REQUESTED",
    entityType: "TransferRequest",
    entityId: transfer.id,
    metadata: { assetId: allocation.assetId, targetType, targetId },
  });

  await notify({
    userId: user.id,
    type: "TRANSFER_REQUESTED",
    message: "Your transfer request has been submitted for approval.",
    entityType: "TransferRequest",
    entityId: transfer.id,
  });

  revalidatePath(ALLOCATIONS_PATH);
  return { success: "Transfer request submitted." };
}

export async function approveTransferAction(transferId: string, _formData: FormData) {
  void _formData;
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const result = await db.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findUnique({ where: { id: transferId } });
    if (!transfer || transfer.status !== "REQUESTED") {
      return { error: "This transfer request has already been resolved." as const };
    }

    const activeAllocation = await tx.assetAllocation.findFirst({
      where: { assetId: transfer.assetId, status: "ACTIVE" },
    });
    if (activeAllocation) {
      await tx.assetAllocation.update({
        where: { id: activeAllocation.id },
        data: { status: "RETURNED", returnedAt: new Date() },
      });
    }

    await tx.assetAllocation.create({
      data: {
        assetId: transfer.assetId,
        employeeId: transfer.toEmployeeId,
        departmentId: transfer.toDepartmentId,
      },
    });
    await tx.asset.update({ where: { id: transfer.assetId }, data: { status: "ALLOCATED" } });

    const updatedTransfer = await tx.transferRequest.update({
      where: { id: transferId },
      data: { status: "APPROVED", approvedById: user.id, resolvedAt: new Date() },
    });

    return { transfer: updatedTransfer };
  });

  if ("error" in result) {
    return;
  }

  await logActivity({
    actorId: user.id,
    action: "TRANSFER_APPROVED",
    entityType: "TransferRequest",
    entityId: transferId,
    metadata: { assetId: result.transfer.assetId },
  });

  await notify({
    userId: result.transfer.requestedById,
    type: "TRANSFER_APPROVED",
    message: "Your transfer request was approved.",
    entityType: "TransferRequest",
    entityId: transferId,
  });

  revalidatePath(ALLOCATIONS_PATH);
}

export async function rejectTransferAction(transferId: string, _formData: FormData) {
  void _formData;
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const transfer = await db.transferRequest.findUnique({ where: { id: transferId } });
  if (!transfer || transfer.status !== "REQUESTED") {
    return;
  }

  await db.transferRequest.update({
    where: { id: transferId },
    data: { status: "REJECTED", approvedById: user.id, resolvedAt: new Date() },
  });

  await logActivity({
    actorId: user.id,
    action: "TRANSFER_REJECTED",
    entityType: "TransferRequest",
    entityId: transferId,
    metadata: { assetId: transfer.assetId },
  });

  await notify({
    userId: transfer.requestedById,
    type: "TRANSFER_REJECTED",
    message: "Your transfer request was rejected.",
    entityType: "TransferRequest",
    entityId: transferId,
  });

  revalidatePath(ALLOCATIONS_PATH);
}
