"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/app/actions/auth";
import { Button, Field, FormMessage, inputClass } from "@/components/ui";

export function LoginForm({ verified }: { verified?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined);

  return (
    <form action={action}>
      {verified ? <FormMessage ok>Email verified — you can log in now.</FormMessage> : null}
      <Field label="Email" htmlFor="email" error={state?.errors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@school.edu" />
      </Field>
      <Field label="Password" htmlFor="password" error={state?.errors?.password}>
        <input id="password" name="password" type="password" autoComplete="current-password" className={inputClass} placeholder="Your password" />
      </Field>
      {state?.message && !state.errors ? <FormMessage>{state.message}</FormMessage> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
