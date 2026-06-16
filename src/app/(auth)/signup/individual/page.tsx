import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ButtonLink } from "@/components/ui";

// Screen 2B — individual path. Pricing is DISPLAY COPY ONLY — no billing/Stripe/
// checkout (subscriptions are out of scope per the spec).
export default function IndividualSignupPage() {
  return (
    <>
      <div className="mb-8">
        <Wordmark />
      </div>
      <h1 className="font-display text-2xl font-semibold">Set up your Playbook</h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        Everything you need to route NIL income, set aside taxes, and build a plan that
        outlasts your playing career.
      </p>

      <div className="rounded-2xl border border-green-border bg-green-tint p-4">
        <p className="text-sm font-medium text-green">
          $9.99/month, or $79/year — save ~34% annually. Cancel anytime.
        </p>
        <p className="mt-2 text-xs text-muted">
          No charge today — you&apos;ll set up payment after onboarding.
        </p>
      </div>

      <ButtonLink href="/signup/account" className="mt-5">
        Continue
      </ButtonLink>

      <Link href="/signup/school" className="mt-4 block text-center text-sm text-green">
        Have a school code? Use that instead
      </Link>
    </>
  );
}
