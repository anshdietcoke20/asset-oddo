"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AssetFilterBarProps {
  categories: { id: string; name: string }[];
}

const STATUS_OPTIONS = [
  "AVAILABLE",
  "ALLOCATED",
  "RESERVED",
  "UNDER_MAINTENANCE",
  "LOST",
  "RETIRED",
  "DISPOSED",
] as const;

export function AssetFilterBar({ categories }: AssetFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tag, setTag] = React.useState(searchParams.get("tag") ?? "");
  const [serial, setSerial] = React.useState(searchParams.get("serial") ?? "");
  const [categoryId, setCategoryId] = React.useState(searchParams.get("categoryId") ?? "");
  const [status, setStatus] = React.useState(searchParams.get("status") ?? "");
  const [location, setLocation] = React.useState(searchParams.get("location") ?? "");

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tag.trim()) params.set("tag", tag.trim());
    if (serial.trim()) params.set("serial", serial.trim());
    if (categoryId) params.set("categoryId", categoryId);
    if (status) params.set("status", status);
    if (location.trim()) params.set("location", location.trim());
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setTag("");
    setSerial("");
    setCategoryId("");
    setStatus("");
    setLocation("");
    router.push(pathname);
  }

  return (
    <form
      onSubmit={applyFilters}
      className="grid grid-cols-2 gap-4 rounded-xl bg-surface-card-dark p-4 md:grid-cols-3 lg:grid-cols-6"
    >
      <div>
        <Label htmlFor="filter-tag">Asset tag</Label>
        <Input
          id="filter-tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="AF-0001"
        />
      </div>
      <div>
        <Label htmlFor="filter-serial">Serial number</Label>
        <Input
          id="filter-serial"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="Serial #"
        />
      </div>
      <div>
        <Label htmlFor="filter-category">Category</Label>
        <Select
          id="filter-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="filter-status">Status</Label>
        <Select id="filter-status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="filter-location">Location</Label>
        <Input
          id="filter-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" variant="primary" className="w-full">
          Filter
        </Button>
        <Button type="button" variant="tertiary" onClick={clearFilters}>
          Clear
        </Button>
      </div>
    </form>
  );
}
