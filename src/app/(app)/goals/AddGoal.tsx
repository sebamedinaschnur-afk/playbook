"use client";

import { useActionState, useEffect, useState } from "react";
import { createGoal, type GoalState } from "@/app/actions/goals";
import { GOAL_TEMPLATES, type GoalTemplate } from "@/lib/goalTemplates";
import { Button, inputClass } from "@/components/ui";

function defaultDateStr(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function AddGoal() {
  const [view, setView] = useState<{ open: boolean; tpl: GoalTemplate | null }>({
    open: false,
    tpl: null,
  });
  const [state, action, pending] = useActionState<GoalState, FormData>(createGoal, undefined);

  useEffect(() => {
    if (!state?.ok) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- collapse after a successful add
    setView({ open: false, tpl: null });
  }, [state]);

  if (!view.open) {
    return (
      <button
        type="button"
        onClick={() => setView({ open: true, tpl: null })}
        className="w-full rounded-2xl border border-dashed border-line bg-panel/50 py-3 text-sm font-medium text-green"
      >
        + Add a goal
      </button>
    );
  }

  if (!view.tpl) {
    return (
      <div className="rounded-2xl border border-line bg-panel p-4">
        <p className="mb-3 text-sm font-medium">What are you building toward?</p>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_TEMPLATES.map((t) => (
            <button
              key={t.category}
              type="button"
              onClick={() => setView({ open: true, tpl: t })}
              className="rounded-xl border border-line bg-bg px-3 py-3 text-left"
            >
              <span className="text-lg">{t.emoji}</span>
              <p className="mt-1 text-sm font-medium">{t.label}</p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setView({ open: false, tpl: null })}
          className="mt-3 w-full py-1 text-center text-sm text-muted"
        >
          Cancel
        </button>
      </div>
    );
  }

  const tpl = view.tpl;
  const suggestedMonthly = Math.round(tpl.defaultTarget / (tpl.defaultYears * 12));

  return (
    <form action={action} className="rounded-2xl border border-line bg-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">{tpl.emoji}</span>
        <p className="text-sm font-medium">{tpl.label}</p>
      </div>
      <input type="hidden" name="category" value={tpl.category} />

      <label className="mb-1 block text-xs text-muted">Name</label>
      <input name="title" defaultValue={tpl.label} className={`${inputClass} mb-2`} />
      {state?.errors?.title ? <p className="mb-2 text-xs text-red">{state.errors.title[0]}</p> : null}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted">Target amount</label>
          <input name="targetAmount" type="number" min="0" step="500" defaultValue={tpl.defaultTarget} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Target date</label>
          <input name="targetDate" type="date" defaultValue={defaultDateStr(tpl.defaultYears)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Saving / month</label>
          <input name="monthlyContribution" type="number" min="0" step="25" defaultValue={suggestedMonthly} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Already saved</label>
          <input name="currentSaved" type="number" min="0" step="100" defaultValue={0} className={inputClass} />
        </div>
      </div>
      {state?.errors?.targetAmount ? (
        <p className="mt-2 text-xs text-red">{state.errors.targetAmount[0]}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-4">
        {pending ? "Adding…" : "Add this goal"}
      </Button>
      <button
        type="button"
        onClick={() => setView({ open: true, tpl: null })}
        className="mt-2 w-full py-1 text-center text-sm text-muted"
      >
        Back
      </button>
    </form>
  );
}
