import { requireRole } from "@/lib/dal";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  getUtilizationReport,
  getMaintenanceFrequencyReport,
  getDueForReviewReport,
  getDepartmentAllocationReport,
  getBookingHeatmapReport,
} from "@/lib/reports";
import {
  exportUtilizationCsv,
  exportIdleAssetsCsv,
  exportMaintenanceByAssetCsv,
  exportMaintenanceByCategoryCsv,
  exportRetirementCandidatesCsv,
  exportMaintenanceDueCsv,
  exportDepartmentAllocationCsv,
  exportBookingHeatmapCsv,
} from "@/lib/actions/reports";
import { ExportCsvButton } from "./_components/export-csv-button";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ReportsPage() {
  await requireRole(["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"]);

  const [utilization, maintenanceFrequency, dueForReview, departmentAllocation, bookingHeatmap] =
    await Promise.all([
      getUtilizationReport(),
      getMaintenanceFrequencyReport(),
      getDueForReviewReport(),
      getDepartmentAllocationReport(),
      getBookingHeatmapReport(),
    ]);

  const maxBookingCount = Math.max(1, ...bookingHeatmap.map((day) => day.count));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display-sm text-on-dark">Reports</h1>
        <p className="mt-1 text-body-md text-muted">
          Operational reporting across utilization, maintenance, and allocations.
        </p>
      </div>

      <Tabs defaultValue="utilization">
        <TabsList>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance frequency</TabsTrigger>
          <TabsTrigger value="due">Due for review</TabsTrigger>
          <TabsTrigger value="departments">Department allocation</TabsTrigger>
          <TabsTrigger value="bookings">Booking heatmap</TabsTrigger>
        </TabsList>

        {/* --- Utilization ------------------------------------------------ */}
        <TabsContent value="utilization" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Most-used assets</CardTitle>
              <ExportCsvButton
                action={exportUtilizationCsv}
                filename="utilization-report.csv"
              />
            </CardHeader>
            {utilization.used.length === 0 ? (
              <p className="text-body-md text-muted">No allocations recorded yet.</p>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Asset</TableHeadCell>
                    <TableHeadCell>Total days allocated</TableHeadCell>
                    <TableHeadCell>Allocation count</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {utilization.used.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="text-body-sm text-on-dark">{asset.name}</div>
                        <div className="text-caption text-muted">{asset.assetTag}</div>
                      </TableCell>
                      <TableCell>{asset.totalDays.toFixed(1)} days</TableCell>
                      <TableCell>{asset.allocationCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Idle assets (never allocated)</CardTitle>
              <ExportCsvButton action={exportIdleAssetsCsv} filename="idle-assets.csv" />
            </CardHeader>
            {utilization.idle.length === 0 ? (
              <p className="text-body-md text-muted">Every asset has been allocated at least once.</p>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Asset</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {utilization.idle.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="text-body-sm text-on-dark">{asset.name}</div>
                        <div className="text-caption text-muted">{asset.assetTag}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* --- Maintenance frequency --------------------------------------- */}
        <TabsContent value="maintenance" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>By asset</CardTitle>
              <ExportCsvButton
                action={exportMaintenanceByAssetCsv}
                filename="maintenance-by-asset.csv"
              />
            </CardHeader>
            {maintenanceFrequency.byAsset.length === 0 ? (
              <p className="text-body-md text-muted">No maintenance requests recorded yet.</p>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Asset</TableHeadCell>
                    <TableHeadCell>Requests</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenanceFrequency.byAsset.map((asset) => (
                    <TableRow key={asset.assetTag}>
                      <TableCell>
                        <div className="text-body-sm text-on-dark">{asset.name}</div>
                        <div className="text-caption text-muted">{asset.assetTag}</div>
                      </TableCell>
                      <TableCell>{asset.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By category</CardTitle>
              <ExportCsvButton
                action={exportMaintenanceByCategoryCsv}
                filename="maintenance-by-category.csv"
              />
            </CardHeader>
            {maintenanceFrequency.byCategory.length === 0 ? (
              <p className="text-body-md text-muted">No maintenance requests recorded yet.</p>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Category</TableHeadCell>
                    <TableHeadCell>Requests</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenanceFrequency.byCategory.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* --- Due for maintenance / retirement ----------------------------- */}
        <TabsContent value="due" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Retirement candidates (acquired 3+ years ago)</CardTitle>
              <ExportCsvButton
                action={exportRetirementCandidatesCsv}
                filename="retirement-candidates.csv"
              />
            </CardHeader>
            {dueForReview.retirementCandidates.length === 0 ? (
              <p className="text-body-md text-muted">No assets meet the retirement heuristic.</p>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Asset</TableHeadCell>
                    <TableHeadCell>Acquired</TableHeadCell>
                    <TableHeadCell>Condition</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dueForReview.retirementCandidates.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="text-body-sm text-on-dark">{asset.name}</div>
                        <div className="text-caption text-muted">{asset.assetTag}</div>
                      </TableCell>
                      <TableCell>{formatDate(asset.acquisitionDate)}</TableCell>
                      <TableCell>
                        <Badge tone={asset.condition === "DAMAGED" || asset.condition === "POOR" ? "danger" : "neutral"}>
                          {asset.condition}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance-due candidates (3+ resolved requests in 6 months)</CardTitle>
              <ExportCsvButton
                action={exportMaintenanceDueCsv}
                filename="maintenance-due-candidates.csv"
              />
            </CardHeader>
            {dueForReview.maintenanceDueCandidates.length === 0 ? (
              <p className="text-body-md text-muted">No assets meet the maintenance-due heuristic.</p>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Asset</TableHeadCell>
                    <TableHeadCell>Resolved requests (6 months)</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dueForReview.maintenanceDueCandidates.map((asset) => (
                    <TableRow key={asset.assetTag}>
                      <TableCell>
                        <div className="text-body-sm text-on-dark">{asset.name}</div>
                        <div className="text-caption text-muted">{asset.assetTag}</div>
                      </TableCell>
                      <TableCell>
                        <Badge tone="warning">{asset.count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* --- Department allocation summary --------------------------------- */}
        <TabsContent value="departments" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active allocations by department</CardTitle>
              <ExportCsvButton
                action={exportDepartmentAllocationCsv}
                filename="department-allocation-summary.csv"
              />
            </CardHeader>
            {departmentAllocation.length === 0 ? (
              <p className="text-body-md text-muted">No departments configured yet.</p>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Department</TableHeadCell>
                    <TableHeadCell>Active allocations</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departmentAllocation.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell>{department.name}</TableCell>
                      <TableCell>{department.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* --- Booking heatmap ------------------------------------------------ */}
        <TabsContent value="bookings" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bookings by day of week</CardTitle>
              <ExportCsvButton action={exportBookingHeatmapCsv} filename="booking-heatmap.csv" />
            </CardHeader>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Day</TableHeadCell>
                  <TableHeadCell>Bookings</TableHeadCell>
                  <TableHeadCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {bookingHeatmap.map((day) => (
                  <TableRow key={day.day}>
                    <TableCell>{day.day}</TableCell>
                    <TableCell>{day.count}</TableCell>
                    <TableCell>
                      <div className="h-2 w-full max-w-40 rounded-full bg-surface-elevated-dark">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${(day.count / maxBookingCount) * 100}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
