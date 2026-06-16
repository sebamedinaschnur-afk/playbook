import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

// Screen 1 — the fork. Routes into the school path or the individual path,
// which both merge back into the shared account step → existing onboarding.
export default function SignupPage() {
  return (
    <>
      <div className="mb-8">
        <Wordmark />
      </div>
      <h1 className="font-display text-2xl font-semibold">Let&apos;s get you set up</h1>
      <p className="mt-2 mb-6 text-sm text-muted">Two ways in. Pick yours.</p>

      <div className="space-y-3">
        <Link
          href="/signup/school"
          className="block rounded-2xl border border-line bg-panel p-4 transition active:scale-[.99]"
        >
          <p className="text-sm font-medium">My school gave me a code</p>
          <p className="mt-1 text-sm text-muted">
            Your access is covered — enter your code and you&apos;re in.
          </p>
        </Link>

        <Link
          href="/signup/individual"
          className="block rounded-2xl border border-line bg-panel p-4 transition active:scale-[.99]"
        >
          <p className="text-sm font-medium">I&apos;m signing up on my own</p>
          <p className="mt-1 text-sm text-muted">
            Set up your own plan and run it your way.
          </p>
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-green">
          Log in
        </Link>
      </p>
    </>
  );
}
