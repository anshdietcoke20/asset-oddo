"use client";

import { useTransition } from "react";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary-dark"
      disabled={disabled || isPending}
      onClick={() => startTransition(() => markAllNotificationsRead())}
    >
      {isPending ? "Marking…" : "Mark all read"}
    </Button>
  );
}
