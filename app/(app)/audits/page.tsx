import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { NewAuditCycleModal } from "./new-audit-cycle-modal";

const STATUS_TONE: Record<string, BadgeTone> = {
  OPEN: "warning",
  CLOSED: "success",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AuditsPage() {
  await requireRole(["ADMIN", "ASSET_MANAGER"]);

  const [cycles, departments] = await Promise.all([
    db.auditCycle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        scopeDepartment: true,
        _count: { select: { items: true } },
      },
    }),
    db.department.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-on-dark">Asset audits</h1>
          <p className="mt-1 text-body-md text-muted">
            Run scoped verification cycles and track discrepancies across the asset fleet.
          </p>
        </div>
        <NewAuditCycleModal departments={departments} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit cycles</CardTitle>
        </CardHeader>
        {cycles.length === 0 ? (
          <p className="text-body-md text-muted">
            No audit cycles yet. Create one to start verifying assets.
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Scope</TableHeadCell>
                <TableHeadCell>Start</TableHeadCell>
                <TableHeadCell>End</TableHeadCell>
                <TableHeadCell>Items</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cycles.map((cycle) => {
                const scope = cycle.scopeDepartment?.name ?? cycle.scopeLocation ?? "All assets";
                return (
                  <TableRow key={cycle.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/audits/${cycle.id}`} className="hover:text-primary">
                        {cycle.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted">{scope}</TableCell>
                    <TableCell className="text-muted">{formatDate(cycle.startDate)}</TableCell>
                    <TableCell className="text-muted">{formatDate(cycle.endDate)}</TableCell>
                    <TableCell className="text-muted">{cycle._count.items}</TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[cycle.status] ?? "neutral"}>{cycle.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
