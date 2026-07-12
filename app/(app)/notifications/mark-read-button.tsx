"use client";

import { useTransition } from "react";
import { markNotificationRead } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";

export function MarkReadButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="tertiary"
      className="h-8 px-3 text-caption"
      disabled={isPending}
      onClick={() => startTransition(() => markNotificationRead(id))}
    >
      {isPending ? "Marking…" : "Mark read"}
    </Button>
  );
}
