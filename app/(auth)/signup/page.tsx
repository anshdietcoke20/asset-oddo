"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUpAction, undefined);

  return (
    <Card>
      <h1 className="mb-1 text-title-md text-on-dark">Create your account</h1>
      <p className="mb-6 text-body-sm text-muted">
        New accounts start as Employees. An Admin can promote you to Department Head or Asset
        Manager from the Employee Directory.
      </p>
      <form action={action} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" autoComplete="name" required />
          <FieldError>{state?.fieldErrors?.name?.[0]}</FieldError>
        </div>
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
            autoComplete="new-password"
            required
          />
          <FieldError>{state?.fieldErrors?.password?.[0]}</FieldError>
        </div>
        {state?.error && <p className="text-caption text-danger">{state.error}</p>}
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating account…" : "Sign up"}
        </Button>
      </form>
      <div className="mt-4 text-center text-caption text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </div>
    </Card>
  );
}
