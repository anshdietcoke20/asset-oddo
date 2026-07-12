import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { maintenancePriorityBadgeTone, maintenanceStatusBadgeTone } from "@/lib/maintenance";
import { RaiseRequestModal } from "./raise-request-modal";
import { RequestRowActions } from "./request-row-actions";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  TECHNICIAN_ASSIGNED: "Technician assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function MaintenancePage() {
  const user = await requireUser();

  const [requests, assets] = await Promise.all([
    db.maintenanceRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        raisedBy: { select: { id: true, name: true } },
      },
    }),
    db.asset.findMany({
      orderBy: { assetTag: "asc" },
      select: { id: true, name: true, assetTag: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-on-dark">Maintenance</h1>
          <p className="mt-1 text-body-md text-muted">
            Track maintenance requests from being raised through resolution.
          </p>
        </div>
        <RaiseRequestModal assets={assets} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All requests</CardTitle>
        </CardHeader>
        {requests.length === 0 ? (
          <p className="text-body-md text-muted">No maintenance requests yet.</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Asset</TableHeadCell>
                <TableHeadCell>Issue</TableHeadCell>
                <TableHeadCell>Priority</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Raised by</TableHeadCell>
                <TableHeadCell>Technician</TableHeadCell>
                <TableHeadCell>Raised</TableHeadCell>
                <TableHeadCell>Resolved</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="text-body-sm text-on-dark">{request.asset.name}</div>
                    <div className="text-caption text-muted">{request.asset.assetTag}</div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="line-clamp-2 text-body-sm">{request.issueDescription}</p>
                    {request.photoUrl && (
                      <a
                        href={request.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-caption text-primary hover:underline"
                      >
                        View photo
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge tone={maintenancePriorityBadgeTone(request.priority)}>
                      {PRIORITY_LABELS[request.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tone={maintenanceStatusBadgeTone(request.status)}>
                      {STATUS_LABELS[request.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.raisedBy.name}</TableCell>
                  <TableCell>{request.technicianName ?? "—"}</TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>{formatDate(request.resolvedAt)}</TableCell>
                  <TableCell>
                    <RequestRowActions id={request.id} status={request.status} role={user.role} />
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
