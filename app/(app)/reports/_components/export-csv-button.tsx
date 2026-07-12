"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ExportCsvButton({
  action,
  filename,
  label = "Export CSV",
}: {
  action: () => Promise<string>;
  filename: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const csv = await action();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        setError("Failed to export CSV.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary-dark"
        onClick={handleClick}
        disabled={isPending}
        className="h-8 px-4 text-caption"
      >
        {isPending ? "Exporting…" : label}
      </Button>
      {error && <span className="text-caption text-danger">{error}</span>}
    </div>
  );
}
