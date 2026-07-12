"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

interface AssetOption {
  id: string;
  name: string;
  assetTag: string;
}

export function AssetFilter({
  assets,
  selectedAssetId,
}: {
  assets: AssetOption[];
  selectedAssetId?: string;
}) {
  const router = useRouter();

  return (
    <Select
      aria-label="Filter by asset"
      className="max-w-sm"
      value={selectedAssetId ?? ""}
      onChange={(event) => {
        const value = event.target.value;
        router.push(value ? `/bookings?assetId=${value}` : "/bookings");
      }}
    >
      <option value="">All bookable assets</option>
      {assets.map((asset) => (
        <option key={asset.id} value={asset.id}>
          {asset.name} ({asset.assetTag})
        </option>
      ))}
    </Select>
  );
}
