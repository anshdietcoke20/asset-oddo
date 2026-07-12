import {
  approveMaintenanceRequest,
  assignTechnician,
  rejectMaintenanceRequest,
  resolveMaintenanceRequest,
  startProgress,
} from "@/lib/actions/maintenance";
import { getAvailableMaintenanceActions } from "@/lib/maintenance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MaintenanceStatus, Role } from "@/generated/prisma/client";

export function RequestRowActions({
  id,
  status,
  role,
}: {
  id: string;
  status: MaintenanceStatus;
  role: Role;
}) {
  const actions = getAvailableMaintenanceActions(status, role);
  if (actions.length === 0) return <span className="text-caption text-muted">—</span>;

  return (
    <div className="flex flex-col items-start gap-2">
      {actions.includes("approve") && (
        <form action={approveMaintenanceRequest.bind(null, id)}>
          <Button type="submit" variant="secondary-dark" className="h-8 px-4 text-caption">
            Approve
          </Button>
        </form>
      )}
      {actions.includes("reject") && (
        <form action={rejectMaintenanceRequest.bind(null, id)}>
          <Button type="submit" variant="danger" className="h-8 px-4 text-caption">
            Reject
          </Button>
        </form>
      )}
      {actions.includes("assign") && (
        <form action={assignTechnician.bind(null, id)} className="flex items-center gap-2">
          <Input
            name="technicianName"
            placeholder="Technician name"
            required
            className="h-8 w-40 text-caption"
          />
          <Button type="submit" variant="secondary-dark" className="h-8 px-4 text-caption">
            Assign
          </Button>
        </form>
      )}
      {actions.includes("start") && (
        <form action={startProgress.bind(null, id)}>
          <Button type="submit" variant="secondary-dark" className="h-8 px-4 text-caption">
            Start progress
          </Button>
        </form>
      )}
      {actions.includes("resolve") && (
        <form action={resolveMaintenanceRequest.bind(null, id)} className="flex items-center gap-2">
          <Input
            name="resolutionNotes"
            placeholder="Resolution notes"
            className="h-8 w-40 text-caption"
          />
          <Button type="submit" variant="secondary-dark" className="h-8 px-4 text-caption">
            Resolve
          </Button>
        </form>
      )}
    </div>
  );
}
