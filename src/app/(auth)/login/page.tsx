import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { LoginForm } from "./LoginForm";

// Next.js 16: searchParams is async.
export default async function LoginPage(props: PageProps<"/login">) {
  const { verified } = await props.searchParams;
  return (
    <>
      <div className="mb-8">
        <Wordmark />
        <p className="mt-3 text-center text-sm text-muted">Welcome back.</p>
      </div>
      <LoginForm verified={verified === "1"} />
      <p className="mt-6 text-center text-sm text-muted">
        New to Playbook?{" "}
        <Link href="/signup" className="text-green">
          Create an account
        </Link>
      </p>
    </>
  );
}
