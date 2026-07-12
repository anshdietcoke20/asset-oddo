import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import type { Prisma, AssetStatus } from "@/generated/prisma/client";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { AssetFilterBar } from "./_components/asset-filter-bar";
import { RegisterAssetModal } from "./_components/register-asset-modal";

const STATUS_BADGE_TONE: Record<AssetStatus, BadgeTone> = {
  AVAILABLE: "success",
  ALLOCATED: "info",
  RESERVED: "warning",
  UNDER_MAINTENANCE: "warning",
  LOST: "danger",
  RETIRED: "neutral",
  DISPOSED: "neutral",
};

interface AssetsPageProps {
  searchParams: Promise<{
    tag?: string;
    serial?: string;
    categoryId?: string;
    status?: string;
    location?: string;
  }>;
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const user = await requireUser();
  const filters = await searchParams;

  const where: Prisma.AssetWhereInput = {};
  if (filters.tag) where.assetTag = { contains: filters.tag, mode: "insensitive" };
  if (filters.serial) where.serialNumber = { contains: filters.serial, mode: "insensitive" };
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status) where.status = filters.status as AssetStatus;
  if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };

  const [assets, categories] = await Promise.all([
    db.asset.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    db.assetCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const activeAllocations = await db.assetAllocation.findMany({
    where: { assetId: { in: assets.map((a) => a.id) }, status: "ACTIVE" },
    include: { employee: true, department: true },
  });
  const holderByAssetId = new Map(
    activeAllocations.map((alloc) => [
      alloc.assetId,
      alloc.employee?.name ?? alloc.department?.name ?? null,
    ]),
  );

  const canRegister = user.role === "ADMIN" || user.role === "ASSET_MANAGER";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-on-dark">Assets</h1>
          <p className="mt-1 text-body-md text-muted">{assets.length} assets in the registry.</p>
        </div>
        {canRegister && <RegisterAssetModal categories={categories} />}
      </div>

      <AssetFilterBar categories={categories} />

      <Card className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>Tag</TableHeadCell>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Category</TableHeadCell>
              <TableHeadCell>Condition</TableHeadCell>
              <TableHeadCell>Location</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Held by</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((asset) => {
              const holder = holderByAssetId.get(asset.id);
              return (
                <TableRow key={asset.id}>
                  <TableCell>
                    <Link
                      href={`/assets/${asset.id}`}
                      className="font-medium text-on-dark hover:text-primary hover:underline"
                    >
                      {asset.assetTag}
                    </Link>
                  </TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.category.name}</TableCell>
                  <TableCell>{asset.condition}</TableCell>
                  <TableCell>{asset.location ?? "—"}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_BADGE_TONE[asset.status]}>
                      {asset.status.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {holder ? (
                      <span className="text-body">Held by: {holder}</span>
                    ) : (
                      <span className="text-muted">Available</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {assets.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted">
                  No assets match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
