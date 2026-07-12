"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notifications";

export type MaintenanceFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: string }
  | undefined;

const RaiseMaintenanceRequestSchema = z.object({
  assetId: z.string().trim().min(1, "Select an asset"),
  issueDescription: z.string().trim().min(5, "Describe the issue in a bit more detail"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  photoUrl: z.string().trim().optional(),
});

export async function raiseMaintenanceRequest(
  _prevState: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  const user = await requireUser();

  const parsed = RaiseMaintenanceRequestSchema.safeParse({
    assetId: formData.get("assetId"),
    issueDescription: formData.get("issueDescription"),
    priority: formData.get("priority"),
    photoUrl: formData.get("photoUrl"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { assetId, issueDescription, priority, photoUrl } = parsed.data;

  const asset = await db.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    return { fieldErrors: { assetId: ["Select a valid asset"] } };
  }

  try {
    const request = await db.maintenanceRequest.create({
      data: {
        assetId,
        raisedById: user.id,
        issueDescription,
        priority,
        photoUrl: photoUrl || undefined,
        status: "PENDING",
      },
    });

    await logActivity({
      actorId: user.id,
      action: "MAINTENANCE_REQUESTED",
      entityType: "MaintenanceRequest",
      entityId: request.id,
      metadata: { assetId, assetTag: asset.assetTag, priority },
    });

    revalidatePath("/maintenance");
    return { success: "Maintenance request raised." };
  } catch {
    return { error: "Failed to raise maintenance request. Please try again." };
  }
}

export async function approveMaintenanceRequest(id: string) {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const request = await db.maintenanceRequest.findUnique({ where: { id } });
  if (!request || request.status !== "PENDING") return;

  await db.$transaction([
    db.maintenanceRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedById: user.id },
    }),
    db.asset.update({
      where: { id: request.assetId },
      data: { status: "UNDER_MAINTENANCE" },
    }),
  ]);

  await logActivity({
    actorId: user.id,
    action: "MAINTENANCE_APPROVED",
    entityType: "MaintenanceRequest",
    entityId: id,
  });

  await notify({
    userId: request.raisedById,
    type: "MAINTENANCE_APPROVED",
    message: "Your maintenance request was approved.",
    entityType: "MaintenanceRequest",
    entityId: id,
  });

  revalidatePath("/maintenance");
}

export async function rejectMaintenanceRequest(id: string) {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const request = await db.maintenanceRequest.findUnique({ where: { id } });
  if (!request || request.status !== "PENDING") return;

  await db.maintenanceRequest.update({
    where: { id },
    data: { status: "REJECTED", approvedById: user.id },
  });

  await logActivity({
    actorId: user.id,
    action: "MAINTENANCE_REJECTED",
    entityType: "MaintenanceRequest",
    entityId: id,
  });

  await notify({
    userId: request.raisedById,
    type: "MAINTENANCE_REJECTED",
    message: "Your maintenance request was rejected.",
    entityType: "MaintenanceRequest",
    entityId: id,
  });

  revalidatePath("/maintenance");
}

export async function assignTechnician(id: string, formData: FormData) {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const technicianName = String(formData.get("technicianName") ?? "").trim();
  if (!technicianName) return;

  const request = await db.maintenanceRequest.findUnique({ where: { id } });
  if (!request || request.status !== "APPROVED") return;

  await db.maintenanceRequest.update({
    where: { id },
    data: { technicianName, status: "TECHNICIAN_ASSIGNED" },
  });

  await logActivity({
    actorId: user.id,
    action: "MAINTENANCE_TECHNICIAN_ASSIGNED",
    entityType: "MaintenanceRequest",
    entityId: id,
    metadata: { technicianName },
  });

  revalidatePath("/maintenance");
}

export async function startProgress(id: string) {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const request = await db.maintenanceRequest.findUnique({ where: { id } });
  if (!request || request.status !== "TECHNICIAN_ASSIGNED") return;

  await db.maintenanceRequest.update({
    where: { id },
    data: { status: "IN_PROGRESS" },
  });

  await logActivity({
    actorId: user.id,
    action: "MAINTENANCE_STARTED",
    entityType: "MaintenanceRequest",
    entityId: id,
  });

  revalidatePath("/maintenance");
}

export async function resolveMaintenanceRequest(id: string, formData: FormData) {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const resolutionNotes = String(formData.get("resolutionNotes") ?? "").trim();

  const request = await db.maintenanceRequest.findUnique({ where: { id } });
  if (!request || request.status !== "IN_PROGRESS") return;

  await db.$transaction([
    db.maintenanceRequest.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || undefined,
      },
    }),
    db.asset.update({
      where: { id: request.assetId },
      data: { status: "AVAILABLE" },
    }),
  ]);

  await logActivity({
    actorId: user.id,
    action: "MAINTENANCE_RESOLVED",
    entityType: "MaintenanceRequest",
    entityId: id,
  });

  revalidatePath("/maintenance");
}
