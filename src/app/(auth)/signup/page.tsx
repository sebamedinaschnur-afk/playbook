import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <>
      <div className="mb-8">
        <Wordmark />
        <p className="mt-3 text-center text-sm text-muted">
          Your money has a season too. Route it like you mean it.
        </p>
      </div>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-green">
          Log in
        </Link>
      </p>
    </>
  );
}
