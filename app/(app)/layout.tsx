import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { AppShell } from "@/components/shell/app-shell";
import { logOutAction } from "@/lib/actions/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <AppShell
      user={{ name: user.name, role: user.role }}
      unreadCount={unreadCount}
      onLogout={logOutAction}
    >
      {children}
    </AppShell>
  );
}
