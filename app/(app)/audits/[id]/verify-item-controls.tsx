"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyAuditItem } from "@/lib/actions/audits";
import { toast } from "@/components/ui/toast";

type VerifyResult = "VERIFIED" | "MISSING" | "DAMAGED";

export function VerifyItemControls({
  itemId,
  initialNotes,
}: {
  itemId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = React.useState(initialNotes ?? "");
  const [pending, startTransition] = React.useTransition();
  const [pendingResult, setPendingResult] = React.useState<VerifyResult | null>(null);

  function handleVerify(result: VerifyResult) {
    setPendingResult(result);
    startTransition(async () => {
      const res = await verifyAuditItem(itemId, result, notes);
      if (res?.error) {
        toast({ title: "Could not save", description: res.error, tone: "danger" });
      } else {
        toast({ title: `Marked as ${result.toLowerCase()}`, tone: "success" });
      }
      setPendingResult(null);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        tone="dark"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="h-9"
      />
      <div className="flex gap-2">
        <Button
          variant="secondary-dark"
          onClick={() => handleVerify("VERIFIED")}
          disabled={pending}
          className="h-8 px-3 text-caption"
        >
          {pending && pendingResult === "VERIFIED" ? "Saving..." : "Verified"}
        </Button>
        <Button
          variant="danger"
          onClick={() => handleVerify("MISSING")}
          disabled={pending}
          className="h-8 px-3 text-caption"
        >
          {pending && pendingResult === "MISSING" ? "Saving..." : "Missing"}
        </Button>
        <Button
          variant="danger"
          onClick={() => handleVerify("DAMAGED")}
          disabled={pending}
          className="h-8 px-3 text-caption"
        >
          {pending && pendingResult === "DAMAGED" ? "Saving..." : "Damaged"}
        </Button>
      </div>
    </div>
  );
}
