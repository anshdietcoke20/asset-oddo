"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = use(searchParams);
  const [state, action, pending] = useActionState(resetPasswordAction, undefined);

  if (!token) {
    return (
      <Card>
        <p className="text-body-md text-danger">
          This reset link is missing its token. Request a new one from the{" "}
          <Link href="/forgot-password" className="text-primary hover:underline">
            forgot password
          </Link>{" "}
          page.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-6 text-title-md text-on-dark">Choose a new password</h1>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          <FieldError>{state?.fieldErrors?.password?.[0]}</FieldError>
        </div>
        {state?.error && <p className="text-caption text-danger">{state.error}</p>}
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Reset password"}
        </Button>
      </form>
    </Card>
  );
}
