"use client";

import { useState } from "react";
import { projectSavings, ILLUSTRATIVE_ANNUAL_RATE } from "@/lib/projection";
import { SliderRow } from "@/components/onboarding-ui";
import { Disclaimer } from "@/components/ui";

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function ProjectionWidget({
  years,
  initialMonthly,
}: {
  years: number;
  initialMonthly: number;
}) {
  const [monthly, setMonthly] = useState(initialMonthly);
  const projected = projectSavings(monthly, years);
  const ratePct = Math.round(ILLUSTRATIVE_ANNUAL_RATE * 100);

  return (
    <div>
      <div className="mb-4 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: Math.max(years, 1) }).map((_, i) => (
          <span key={i} className="h-2.5 flex-1 rounded bg-green-tint" />
        ))}
      </div>

      <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        If you keep saving
      </h2>
      <SliderRow
        id="save"
        label="Save / month"
        min={100}
        max={5000}
        step={50}
        value={monthly}
        onChange={setMonthly}
        format={usd}
      />

      <div className="mt-4 rounded-2xl border border-line bg-panel p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-faint">
          Projected after {years} year{years === 1 ? "" : "s"}
        </p>
        <p className="tnum mt-1 text-4xl text-green">{usd(projected)}</p>
        <p className="mt-1 text-sm text-muted">
          {years} year{years === 1 ? "" : "s"} of saving · assumes {ratePct}% avg annual return
        </p>
      </div>

      <Disclaimer>Illustration only — not financial advice. Actual returns vary.</Disclaimer>
    </div>
  );
}
