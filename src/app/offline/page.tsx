import { Wordmark } from "@/components/Wordmark";

// Offline shell shown when a navigation fails with no network (spec §2.7).
export const metadata = { title: "Offline — Playbook" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <Wordmark />
      <p className="mt-4 text-sm text-muted">You&apos;re offline.</p>
      <p className="mt-1 text-sm text-faint">
        Playbook needs a connection to show your money. Reconnect and we&apos;ll pick right
        back up.
      </p>
    </main>
  );
}
