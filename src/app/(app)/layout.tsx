import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { BottomNav } from "@/components/BottomNav";

// Authenticated app shell: top bar + bottom tab nav (spec screens).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user.onboardingComplete) {
    redirect("/onboarding");
  }

  const initials = (user.name ?? user.email)
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const subtitle = [user.sport, user.school?.name, user.year].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center gap-2.5 px-5 pb-2 pt-6">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-green-tint font-display text-sm font-semibold text-green">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name ?? "Athlete"}</p>
          {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
        </div>
      </header>
      <main className="flex-1 px-5 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
