import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { discrepancyItems } from "@/lib/audit-rules";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { AssignAuditorsForm } from "./assign-auditors-form";
import { VerifyItemControls } from "./verify-item-controls";
import { CloseCycleButton } from "./close-cycle-button";

const CYCLE_STATUS_TONE: Record<string, BadgeTone> = {
  OPEN: "warning",
  CLOSED: "success",
};

const RESULT_TONE: Record<string, BadgeTone> = {
  PENDING: "neutral",
  VERIFIED: "success",
  MISSING: "danger",
  DAMAGED: "danger",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AuditCycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const cycle = await db.auditCycle.findUnique({
    where: { id },
    include: {
      scopeDepartment: true,
      createdBy: true,
      auditors: { include: { employee: true } },
      items: {
        include: { asset: true, verifiedBy: true },
        orderBy: { asset: { assetTag: "asc" } },
      },
    },
  });

  if (!cycle) notFound();

  const isPrivileged = user.role === "ADMIN" || user.role === "ASSET_MANAGER";
  const isAssignedAuditor = cycle.auditors.some((a) => a.employeeId === user.id);
  if (!isPrivileged && !isAssignedAuditor) {
    redirect("/dashboard");
  }

  const canVerify = (isPrivileged || isAssignedAuditor) && cycle.status === "OPEN";
  const scope = cycle.scopeDepartment?.name ?? cycle.scopeLocation ?? "All assets";
  const discrepancies = discrepancyItems(cycle.items);

  const employees = isPrivileged
    ? await db.employee.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-display-sm text-on-dark">{cycle.name}</h1>
          <p className="mt-1 text-body-md text-muted">
            Scope: {scope} &middot; {formatDate(cycle.startDate)} &ndash; {formatDate(cycle.endDate)}
          </p>
          <p className="mt-1 text-body-sm text-muted">Created by {cycle.createdBy.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={CYCLE_STATUS_TONE[cycle.status] ?? "neutral"}>{cycle.status}</Badge>
          {isPrivileged && cycle.status === "OPEN" && <CloseCycleButton auditCycleId={cycle.id} />}
        </div>
      </div>

      {isPrivileged && (
        <Card>
          <CardHeader>
            <CardTitle>Assign auditors</CardTitle>
          </CardHeader>
          <AssignAuditorsForm
            auditCycleId={cycle.id}
            employees={employees}
            initialSelected={cycle.auditors.map((a) => a.employeeId)}
          />
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audit items ({cycle.items.length})</CardTitle>
        </CardHeader>
        {cycle.items.length === 0 ? (
          <p className="text-body-md text-muted">No assets matched this cycle&apos;s scope.</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Asset</TableHeadCell>
                <TableHeadCell>Result</TableHeadCell>
                <TableHeadCell>Verified by</TableHeadCell>
                <TableHeadCell>Notes</TableHeadCell>
                {canVerify && <TableHeadCell>Verify</TableHeadCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {cycle.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="text-body-md text-on-dark">{item.asset.name}</div>
                    <div className="text-caption text-muted">{item.asset.assetTag}</div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={RESULT_TONE[item.result] ?? "neutral"}>{item.result}</Badge>
                  </TableCell>
                  <TableCell className="text-muted">
                    {item.verifiedBy
                      ? `${item.verifiedBy.name} · ${formatDateTime(item.verifiedAt!)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs text-muted">{item.notes ?? "—"}</TableCell>
                  {canVerify && (
                    <TableCell>
                      <VerifyItemControls itemId={item.id} initialNotes={item.notes} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discrepancy report ({discrepancies.length})</CardTitle>
        </CardHeader>
        {discrepancies.length === 0 ? (
          <p className="text-body-md text-muted">No discrepancies flagged yet.</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Asset</TableHeadCell>
                <TableHeadCell>Result</TableHeadCell>
                <TableHeadCell>Notes</TableHeadCell>
                <TableHeadCell>Flagged by</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {discrepancies.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="text-body-md text-on-dark">{item.asset.name}</div>
                    <div className="text-caption text-muted">{item.asset.assetTag}</div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={RESULT_TONE[item.result] ?? "neutral"}>{item.result}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs text-muted">{item.notes ?? "—"}</TableCell>
                  <TableCell className="text-muted">
                    {item.verifiedBy ? item.verifiedBy.name : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
