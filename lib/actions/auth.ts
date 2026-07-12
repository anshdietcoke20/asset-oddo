"use server";

import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export type AuthFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: string }
  | undefined;

const SignUpSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const existing = await db.employee.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.employee.create({
    data: { name, email, passwordHash, role: "EMPLOYEE" },
  });

  await logActivity({
    actorId: user.id,
    action: "SIGNED_UP",
    entityType: "Employee",
    entityId: user.id,
  });
  await createSession(user.id, user.role);
  redirect("/dashboard");
}

const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function logInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;
  const user = await db.employee.findUnique({ where: { email } });
  if (!user || user.status === "INACTIVE") {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  await logActivity({
    actorId: user.id,
    action: "LOGGED_IN",
    entityType: "Employee",
    entityId: user.id,
  });
  await createSession(user.id, user.role);
  redirect("/dashboard");
}

export async function logOutAction() {
  await deleteSession();
  redirect("/login");
}

const ForgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

const RESET_TOKEN_DURATION_MS = 15 * 60 * 1000;

export async function requestPasswordResetAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = ForgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await db.employee.findUnique({ where: { email: parsed.data.email } });
  // Always return the same success message whether or not the account exists,
  // so this endpoint can't be used to enumerate registered emails.
  if (user) {
    const token = randomBytes(32).toString("hex");
    const resetTokenHash = createHash("sha256").update(token).digest("hex");
    await db.employee.update({
      where: { id: user.id },
      data: {
        resetTokenHash,
        resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    if (process.env.RESEND_API_KEY) {
      // Wire up a real email provider here when one is configured.
      console.log(`[auth] password reset email would be sent to ${user.email}: ${resetUrl}`);
    } else {
      console.log(`[auth] password reset link for ${user.email}: ${resetUrl}`);
    }
  }

  return { success: "If that email has an account, a reset link has been sent." };
}

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { token, password } = parsed.data;
  const resetTokenHash = createHash("sha256").update(token).digest("hex");
  const user = await db.employee.findFirst({ where: { resetTokenHash } });

  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.employee.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });
  await logActivity({
    actorId: user.id,
    action: "PASSWORD_RESET",
    entityType: "Employee",
    entityId: user.id,
  });

  redirect("/login");
}
