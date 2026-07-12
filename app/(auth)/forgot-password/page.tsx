"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, undefined);

  return (
    <Card>
      <h1 className="mb-1 text-title-md text-on-dark">Reset your password</h1>
      <p className="mb-6 text-body-sm text-muted">
        Enter your account email and we&apos;ll send you a reset link.
      </p>
      {state?.success ? (
        <p className="text-body-md text-success">{state.success}</p>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            <FieldError>{state?.fieldErrors?.email?.[0]}</FieldError>
          </div>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <div className="mt-4 text-center text-caption text-muted">
        <Link href="/login" className="hover:text-primary">
          Back to log in
        </Link>
      </div>
    </Card>
  );
}
