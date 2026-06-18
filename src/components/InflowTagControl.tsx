"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { tagInflow } from "@/app/actions/transactions";

// Inline "Is this NIL income?" tagger on an untagged Plaid inflow (addendum §7).
export function InflowTagControl({ txnId }: { txnId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function tag(t: "NIL_INCOME" | "NOT_INCOME") {
    startTransition(async () => {
      await tagInflow(txnId, t);
      router.refresh();
    });
  }

  return (
    <span className="mt-1 inline-flex items-center gap-2">
      <span className="text-[11px] text-faint">NIL income?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => tag("NIL_INCOME")}
        className="rounded bg-green-tint px-2 py-0.5 text-[11px] font-semibold text-green disabled:opacity-50"
      >
        Yes, tag it
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => tag("NOT_INCOME")}
        className="rounded border border-line px-2 py-0.5 text-[11px] text-muted disabled:opacity-50"
      >
        Not income
      </button>
    </span>
  );
}
