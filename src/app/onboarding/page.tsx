import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { OnboardingWizard } from "./OnboardingWizard";

// Onboarding flow (spec §2.1). Stores answers and generates the starting rules.
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (user.onboardingComplete) {
    redirect("/home");
  }

  return (
    <main className="mx-auto w-full max-w-md">
      <OnboardingWizard initialName={user.name ?? ""} />
    </main>
  );
}
