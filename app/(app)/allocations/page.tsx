import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AllocateAssetModal } from "./_components/allocate-asset-modal";
import { ReturnAllocationModal } from "./_components/return-allocation-modal";
import { RequestTransferModal } from "./_components/request-transfer-modal";
import { approveTransferAction, rejectTransferAction } from "@/lib/actions/allocations";

export default async function AllocationsPage() {
  const user = await requireUser();
  const canManage = user.role === "ADMIN" || user.role === "ASSET_MANAGER";

  const [allocations, employees, departments, availableAssets, transferRequests] =
    await Promise.all([
      db.assetAllocation.findMany({
        where: { status: "ACTIVE" },
        include: { asset: true, employee: true, department: true },
        orderBy: { allocatedAt: "desc" },
      }),
      db.employee.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      }),
      db.department.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      canManage
        ? db.asset.findMany({
            where: { status: "AVAILABLE" },
            orderBy: { name: "asc" },
            select: { id: true, name: true, assetTag: true },
          })
        : Promise.resolve([]),
      canManage
        ? db.transferRequest.findMany({
            where: { status: "REQUESTED" },
            include: { asset: true, requestedBy: true, toDepartment: true },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

  const toEmployeeIds = transferRequests
    .map((transfer) => transfer.toEmployeeId)
    .filter((id): id is string => Boolean(id));
  const toEmployees = toEmployeeIds.length
    ? await db.employee.findMany({
        where: { id: { in: toEmployeeIds } },
        select: { id: true, name: true },
      })
    : [];
  const toEmployeeNameById = new Map(toEmployees.map((employee) => [employee.id, employee.name]));

  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-on-dark">Allocations</h1>
          <p className="mt-1 text-body-md text-muted">
            Track which assets are currently held, and manage returns and transfers.
          </p>
        </div>
        {canManage && (
          <AllocateAssetModal
            assets={availableAssets}
            employees={employees}
            departments={departments}
          />
        )}
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active allocations</TabsTrigger>
          {canManage && (
            <TabsTrigger value="transfers">
              Transfer requests
              {transferRequests.length > 0 ? ` (${transferRequests.length})` : ""}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="active">
          <Card className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Asset</TableHeadCell>
                  <TableHeadCell>Held by</TableHeadCell>
                  <TableHeadCell>Allocated</TableHeadCell>
                  <TableHeadCell>Expected return</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Actions</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allocations.map((allocation) => {
                  const overdue =
                    allocation.expectedReturnDate !== null &&
                    allocation.expectedReturnDate < now;
                  const heldBy = allocation.employee
                    ? allocation.employee.name
                    : allocation.department
                      ? `${allocation.department.name} (dept.)`
                      : "—";

                  return (
                    <TableRow key={allocation.id}>
                      <TableCell>
                        <div className="text-body-md text-on-dark">{allocation.asset.name}</div>
                        <div className="text-caption text-muted">{allocation.asset.assetTag}</div>
                      </TableCell>
                      <TableCell>{heldBy}</TableCell>
                      <TableCell>{allocation.allocatedAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        {allocation.expectedReturnDate
                          ? allocation.expectedReturnDate.toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {overdue ? (
                          <Badge tone="warning">Overdue</Badge>
                        ) : (
                          <Badge tone="success">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <RequestTransferModal
                            allocationId={allocation.id}
                            assetName={allocation.asset.name}
                            employees={employees}
                            departments={departments}
                          />
                          {canManage && (
                            <ReturnAllocationModal
                              allocationId={allocation.id}
                              assetName={allocation.asset.name}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {allocations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted">
                      No active allocations.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {canManage && (
          <TabsContent value="transfers">
            <Card className="p-0">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Asset</TableHeadCell>
                    <TableHeadCell>Requested by</TableHeadCell>
                    <TableHeadCell>Transfer to</TableHeadCell>
                    <TableHeadCell>Requested</TableHeadCell>
                    <TableHeadCell>Actions</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transferRequests.map((transfer) => {
                    const target = transfer.toEmployeeId
                      ? (toEmployeeNameById.get(transfer.toEmployeeId) ?? "Unknown employee")
                      : transfer.toDepartment
                        ? `${transfer.toDepartment.name} (dept.)`
                        : "—";

                    return (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          <div className="text-body-md text-on-dark">{transfer.asset.name}</div>
                          <div className="text-caption text-muted">{transfer.asset.assetTag}</div>
                        </TableCell>
                        <TableCell>{transfer.requestedBy.name}</TableCell>
                        <TableCell>{target}</TableCell>
                        <TableCell>{transfer.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <form action={approveTransferAction.bind(null, transfer.id)}>
                              <Button type="submit" variant="primary">
                                Approve
                              </Button>
                            </form>
                            <form action={rejectTransferAction.bind(null, transfer.id)}>
                              <Button type="submit" variant="danger">
                                Reject
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {transferRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted">
                        No pending transfer requests.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
