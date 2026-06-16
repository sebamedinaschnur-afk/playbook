import { Wordmark } from "@/components/Wordmark";
import { SchoolCodeForm } from "./SchoolCodeForm";

// Screen 2A — school path. Requires a valid access code to continue.
export default function SchoolSignupPage() {
  return (
    <>
      <div className="mb-8">
        <Wordmark />
      </div>
      <h1 className="font-display text-2xl font-semibold">Enter your school code</h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        This links you to your school and unlocks Playbook at no cost to you.
      </p>
      <SchoolCodeForm />
    </>
  );
}
