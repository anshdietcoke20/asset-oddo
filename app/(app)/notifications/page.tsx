import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MarkAllReadButton } from "./mark-all-read-button";
import { MarkReadButton } from "./mark-read-button";

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  const user = await requireUser();

  const [notifications, activityLogs] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.activityLog.findMany({
      where: user.role === "ADMIN" ? undefined : { actorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display-sm text-on-dark">Notifications</h1>
        <p className="mt-1 text-body-md text-muted">
          Stay on top of what needs your attention, and review recent activity.
        </p>
      </div>

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>
                Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}
              </CardTitle>
              <MarkAllReadButton disabled={unreadCount === 0} />
            </CardHeader>
            {notifications.length === 0 ? (
              <p className="text-body-md text-muted">You have no notifications yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-hairline-on-dark">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={
                          notification.isRead
                            ? "mt-2 h-2 w-2 shrink-0 rounded-full"
                            : "mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                        }
                        aria-hidden
                      />
                      <div>
                        <p
                          className={
                            notification.isRead
                              ? "text-body-sm text-body"
                              : "text-body-sm text-on-dark font-semibold"
                          }
                        >
                          {notification.message}
                        </p>
                        <p className="mt-0.5 text-caption text-muted">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    {!notification.isRead && <MarkReadButton id={notification.id} />}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            {activityLogs.length === 0 ? (
              <p className="text-body-md text-muted">No activity recorded yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-hairline-on-dark">
                {activityLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-body-sm text-on-dark">
                        <span className="font-semibold">{log.actor.name}</span>{" "}
                        <span className="text-muted">{log.action.replaceAll("_", " ").toLowerCase()}</span>{" "}
                        <span className="text-muted">
                          {log.entityType} #{log.entityId.slice(-6)}
                        </span>
                      </p>
                    </div>
                    <p className="shrink-0 text-caption text-muted">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
