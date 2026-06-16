import { Wordmark } from "@/components/Wordmark";
import { AccountForm } from "./AccountForm";

// Shared final step for both paths — email/password. Carries the validated school
// code (if any) from the school path; absent for the individual path.
export default async function AccountPage(props: PageProps<"/signup/account">) {
  const { code } = await props.searchParams;
  const accessCode = typeof code === "string" ? code : "";

  return (
    <>
      <div className="mb-8">
        <Wordmark />
      </div>
      <h1 className="font-display text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        {accessCode
          ? "Last step — your school access is linked. Set your login."
          : "Last step — set your login to start your plan."}
      </p>
      <AccountForm accessCode={accessCode} />
    </>
  );
}
