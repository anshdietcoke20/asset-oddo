"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { closeAuditCycle } from "@/lib/actions/audits";
import { toast } from "@/components/ui/toast";

export function CloseCycleButton({ auditCycleId }: { auditCycleId: string }) {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handleClose() {
    startTransition(async () => {
      const result = await closeAuditCycle(auditCycleId);
      if (result?.error) {
        toast({ title: "Cannot close cycle", description: result.error, tone: "danger" });
      } else {
        toast({ title: "Audit cycle closed", tone: "success" });
        router.refresh();
      }
    });
  }

  return (
    <Button variant="danger" onClick={handleClose} disabled={pending}>
      {pending ? "Closing..." : "Close cycle"}
    </Button>
  );
}
