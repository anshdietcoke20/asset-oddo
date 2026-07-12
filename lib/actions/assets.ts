"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/dal";
import { logActivity } from "@/lib/activity";
import { formatAssetTag } from "@/lib/asset-tag";

export type AssetFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: string }
  | undefined;

const RegisterAssetSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  categoryId: z.string().trim().min(1, "Select a category"),
  serialNumber: z.string().trim().optional(),
  acquisitionDate: z.string().trim().optional(),
  acquisitionCost: z.string().trim().optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  location: z.string().trim().optional(),
  isShared: z.coerce.boolean().optional(),
  photos: z.string().trim().optional(),
});

export async function registerAssetAction(
  _prevState: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const user = await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const parsed = RegisterAssetSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    serialNumber: formData.get("serialNumber"),
    acquisitionDate: formData.get("acquisitionDate"),
    acquisitionCost: formData.get("acquisitionCost"),
    condition: formData.get("condition"),
    location: formData.get("location"),
    isShared: formData.get("isShared") === "on" ? "true" : "false",
    photos: formData.get("photos"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const {
    name,
    categoryId,
    serialNumber,
    acquisitionDate,
    acquisitionCost,
    condition,
    location,
    isShared,
    photos,
  } = parsed.data;

  const category = await db.assetCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    return { fieldErrors: { categoryId: ["Select a valid category"] } };
  }

  const photoList = photos
    ? photos
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  try {
    const count = await db.asset.count();
    const assetTag = formatAssetTag(count + 1);

    const asset = await db.asset.create({
      data: {
        assetTag,
        name,
        categoryId,
        serialNumber: serialNumber || undefined,
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : undefined,
        acquisitionCost: acquisitionCost ? acquisitionCost : undefined,
        condition,
        location: location || undefined,
        isShared: isShared ?? false,
        photos: photoList,
      },
    });

    await logActivity({
      actorId: user.id,
      action: "ASSET_REGISTERED",
      entityType: "Asset",
      entityId: asset.id,
      metadata: { assetTag: asset.assetTag, name: asset.name },
    });

    revalidatePath("/assets");
    return { success: `Asset ${asset.assetTag} registered.` };
  } catch {
    return { error: "Failed to register asset. Please try again." };
  }
}
