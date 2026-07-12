import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/session";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

export const verifySession = cache(async () => {
  const payload = await getSessionPayload();
  if (!payload) redirect("/login");
  return payload;
});

export const getCurrentUser = cache(async () => {
  const payload = await getSessionPayload();
  if (!payload) return null;

  const user = await db.employee.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      departmentId: true,
    },
  });

  if (!user || user.status === "INACTIVE") return null;
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
