"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/app/actions/auth";
import { Button, Field, FormMessage, inputClass, Disclaimer } from "@/components/ui";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-line bg-panel p-5">
        <FormMessage ok>{state.message}</FormMessage>
        <p className="text-sm text-muted">
          We sent a verification link to your email. Click it to activate your account,
          then log in.
        </p>
        {state.devVerifyUrl ? (
          <div className="mt-4 rounded-xl border border-green-border bg-green-tint p-3">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-green">
              Dev mode — no email provider
            </p>
            <Link
              href={state.devVerifyUrl.replace(/^https?:\/\/[^/]+/, "")}
              className="break-all text-sm text-green underline"
            >
              Click here to verify
            </Link>
          </div>
        ) : null}
        <Link href="/login" className="mt-4 block text-center text-sm text-green">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={action}>
      <Field label="Email" htmlFor="email" error={state?.errors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@school.edu" />
      </Field>
      <Field label="Password" htmlFor="password" error={state?.errors?.password}>
        <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} placeholder="At least 8 characters" />
      </Field>
      <Field label="School access code (optional)" htmlFor="accessCode" error={state?.errors?.accessCode}>
        <input id="accessCode" name="accessCode" type="text" className={inputClass} placeholder="e.g. CANES26" />
      </Field>
      {state?.message && !state.errors ? <FormMessage>{state.message}</FormMessage> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <Disclaimer>
        Playbook is a tracker — it never holds or moves your money, and it doesn&apos;t give
        licensed financial advice.
      </Disclaimer>
    </form>
  );
}
