import type { Role } from "@/generated/prisma/client";
import { TopNav } from "@/components/shell/top-nav";
import { SideNav } from "@/components/shell/side-nav";

export interface AppShellProps {
  user: { name: string; role: Role };
  unreadCount?: number;
  onLogout?: () => void | Promise<void>;
  children: React.ReactNode;
}

export function AppShell({ user, unreadCount, onLogout, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav user={user} unreadCount={unreadCount} onLogout={onLogout} />
      <div className="flex flex-1">
        <SideNav role={user.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
