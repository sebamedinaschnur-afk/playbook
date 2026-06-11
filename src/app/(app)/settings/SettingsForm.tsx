"use client";

import { useActionState } from "react";
import { updateRules, type SettingsState } from "@/app/actions/settings";
import { Button, FormMessage, inputClass } from "@/components/ui";

export type RuleField = {
  name: "taxSetAsidePct" | "monthlySavings" | "spendingThreshold";
  label: string;
  prefix?: string;
  suffix?: string;
  value: number;
  why: string;
};

export function SettingsForm({ fields }: { fields: RuleField[] }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateRules,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name} className="rounded-2xl border border-line bg-panel p-4">
          <label htmlFor={f.name} className="block text-sm font-medium">
            {f.label}
          </label>
          <div className="mt-2 flex items-center gap-2">
            {f.prefix ? <span className="text-muted">{f.prefix}</span> : null}
            <input
              id={f.name}
              name={f.name}
              type="number"
              inputMode="numeric"
              step={f.name === "taxSetAsidePct" ? "1" : "50"}
              min="0"
              defaultValue={f.value}
              className={`${inputClass} max-w-[140px]`}
            />
            {f.suffix ? <span className="text-muted">{f.suffix}</span> : null}
          </div>
          {state?.errors?.[f.name]?.length ? (
            <p className="mt-1.5 text-xs text-red">{state.errors[f.name][0]}</p>
          ) : null}
          <p className="mt-2 text-xs leading-relaxed text-faint">{f.why}</p>
        </div>
      ))}

      {state?.ok ? <FormMessage ok>{state.message}</FormMessage> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
