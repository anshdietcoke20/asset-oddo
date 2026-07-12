"use client";

import { useActionState } from "react";
import Link from "next/link";
import { logInAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, action, pending] = useActionState(logInAction, undefined);

  return (
    <Card>
      <h1 className="mb-6 text-title-md text-on-dark">Log in</h1>
      <form action={action} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          <FieldError>{state?.fieldErrors?.email?.[0]}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <FieldError>{state?.fieldErrors?.password?.[0]}</FieldError>
        </div>
        {state?.error && <p className="text-caption text-danger">{state.error}</p>}
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-caption text-muted">
        <Link href="/forgot-password" className="hover:text-primary">
          Forgot password?
        </Link>
        <Link href="/signup" className="hover:text-primary">
          Create account
        </Link>
      </div>
    </Card>
  );
}
