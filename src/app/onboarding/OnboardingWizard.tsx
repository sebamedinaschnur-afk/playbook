"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { generateRules } from "@/lib/rules";
import { SPORTS, YEARS, PAYMENT_CHANNELS } from "@/lib/validation";
import { Button, FormMessage } from "@/components/ui";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import {
  ProgressDots,
  Pill,
  PillRow,
  SliderRow,
  StepHeading,
  PlayRule,
} from "@/components/onboarding-ui";

const TOTAL = 5;

const CHANNEL_LABELS: Record<(typeof PAYMENT_CHANNELS)[number], string> = {
  direct_deposit: "Direct deposit",
  school_collective: "School collective",
  cash_venmo: "Cash / Venmo",
};

const usd = (n: number) => `$${n.toLocaleString()}`;

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Answers
  const [name, setName] = useState(initialName);
  const [sport, setSport] = useState<(typeof SPORTS)[number]>("Football");
  const [year, setYear] = useState<(typeof YEARS)[number]>("Junior");
  const [horizon, setHorizon] = useState(4);
  const [linkedOk, setLinkedOk] = useState(false);
  const [hasNilDeals, setHasNilDeals] = useState(true);
  const [estMonthlyNil, setEstMonthlyNil] = useState(4000);
  const [channels, setChannels] = useState<string[]>(["direct_deposit", "school_collective"]);

  const rules = generateRules(estMonthlyNil, horizon);

  function next() {
    setError(null);
    if (step === 1 && name.trim().length === 0) {
      setError("Please enter your name.");
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL));
  }

  function toggleChannel(c: string) {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding({
        name: name.trim(),
        sport,
        year,
        careerHorizonYears: horizon,
        hasNilDeals,
        estMonthlyNil,
        paymentChannels: channels as (typeof PAYMENT_CHANNELS)[number][],
      });
      // On success the action redirects; only an error object returns here.
      if (res && !res.ok) {
        setError("Something didn't validate — please review your answers.");
      }
    });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <ProgressDots total={TOTAL} current={step} />
      <div className="flex flex-1 flex-col px-6 pb-6 pt-7">
        {step === 1 && (
          <>
            <StepHeading
              title="Tell us about your game"
              lead="This shapes your timeline and your playbook — a junior with two years left gets a different plan than a freshman."
            />
            <label htmlFor="name" className="mb-1.5 block text-xs text-muted">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Torres"
              className="mb-4 w-full rounded-xl border border-line bg-panel px-3.5 py-3 text-sm text-ink outline-none focus:border-green placeholder:text-faint"
            />
            <p className="mb-1.5 text-xs text-muted">Sport</p>
            <PillRow>
              {SPORTS.map((s) => (
                <Pill key={s} selected={sport === s} onClick={() => setSport(s)}>
                  {s}
                </Pill>
              ))}
            </PillRow>
            <p className="mb-1.5 mt-4 text-xs text-muted">Year</p>
            <PillRow>
              {YEARS.map((y) => (
                <Pill key={y} selected={year === y} onClick={() => setYear(y)}>
                  {y}
                </Pill>
              ))}
            </PillRow>
          </>
        )}

        {step === 2 && (
          <>
            <StepHeading
              title="How long do you realistically expect to be earning from your sport?"
              lead="No wrong answer — most playing careers are shorter than people plan for. Your plan should work either way."
            />
            <SliderRow
              id="horizon"
              label="Years"
              min={1}
              max={12}
              step={1}
              value={horizon}
              onChange={setHorizon}
              format={(v) => String(v)}
            />
            <p className="mt-2 text-xs text-faint">
              You can change this anytime. We use it to set your savings pace.
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <StepHeading
              title="Link your accounts"
              lead="This is how Playbook sees payments land and tracks spending automatically — no manual entry."
            />
            <PlaidLinkButton
              onLinked={() => setLinkedOk(true)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-green-border bg-green-tint px-3.5 py-3.5 text-sm font-medium text-green disabled:opacity-50"
            >
              {linkedOk ? "Account linked ✓ — link another" : "Connect a bank with Plaid"}
            </PlaidLinkButton>
            {linkedOk ? (
              <p className="mb-2 text-xs text-green">
                Nice — your accounts are syncing. You can link more or continue.
              </p>
            ) : null}
            <div className="mt-1 flex items-start gap-2.5 rounded-xl border border-line bg-panel p-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DBE8B" strokeWidth="2" strokeLinecap="round" className="mt-0.5 flex-none">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <p className="text-xs leading-relaxed text-muted">
                Connections are handled by Plaid (sandbox). Playbook can read balances and
                transactions but never holds or moves your money. Use{" "}
                <span className="text-ink">user_good</span> /{" "}
                <span className="text-ink">pass_good</span> to test.
              </p>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <StepHeading
              title="Your NIL situation"
              lead="Rough numbers are fine — this sets your tax plan so April never surprises you."
            />
            <p className="mb-1.5 text-xs text-muted">Do you currently have NIL deals?</p>
            <PillRow>
              <Pill selected={hasNilDeals} onClick={() => setHasNilDeals(true)}>
                Yes
              </Pill>
              <Pill selected={!hasNilDeals} onClick={() => setHasNilDeals(false)}>
                Not yet
              </Pill>
            </PillRow>
            <p className="mb-1.5 mt-4 text-xs text-muted">
              About how much per month, on average?
            </p>
            <SliderRow
              id="nil"
              label=""
              min={0}
              max={20000}
              step={500}
              value={estMonthlyNil}
              onChange={setEstMonthlyNil}
              format={usd}
            />
            <p className="mb-1.5 mt-4 text-xs text-muted">Where do deals pay you?</p>
            <PillRow>
              {PAYMENT_CHANNELS.map((c) => (
                <Pill key={c} selected={channels.includes(c)} onClick={() => toggleChannel(c)}>
                  {CHANNEL_LABELS[c]}
                </Pill>
              ))}
            </PillRow>
          </>
        )}

        {step === 5 && (
          <>
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-brass">
              <span className="h-1.5 w-1.5 rounded-full bg-brass" />
              Your plan
            </div>
            <StepHeading
              title="Your starting playbook"
              lead={`Based on a ${horizon}-year window and about ${usd(estMonthlyNil)}/month in NIL income. Every rule is yours to change.`}
            />
            <PlayRule
              title={`Set aside ${rules.taxSetAsidePct}% of every payment for taxes`}
              why={rules.explanations.taxSetAside}
            />
            <PlayRule
              title={`Aim to save ${usd(rules.monthlySavings)}/month`}
              why={rules.explanations.monthlySavings}
            />
            <PlayRule
              title={`Alert when monthly spending passes ${usd(rules.spendingThreshold)}`}
              why={rules.explanations.spendingThreshold}
            />
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              These are educational starting points, not licensed financial advice. You can
              edit every rule in Settings.
            </p>
          </>
        )}

        <div className="flex-1" />

        {error ? <FormMessage>{error}</FormMessage> : null}

        <div className="mt-4 space-y-2">
          {step < TOTAL ? (
            <Button onClick={next} disabled={pending}>
              {step === 4 ? "Build my playbook" : "Next"}
            </Button>
          ) : (
            <Button variant="brass" onClick={submit} disabled={pending}>
              {pending ? "Setting up…" : "Run my playbook"}
            </Button>
          )}
          {step === 3 ? (
            <Button variant="ghost" onClick={next} disabled={pending}>
              Skip for now
            </Button>
          ) : null}
          {step > 1 && step < TOTAL ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="block w-full py-1 text-center text-sm text-muted"
            >
              Back
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
