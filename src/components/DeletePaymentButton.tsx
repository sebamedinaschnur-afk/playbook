"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteManualPayment } from "@/app/actions/payments";

// Delete a manual payment with an inline confirm step (decision #9 reversibility +
// "confirm the action"). Rolls back reserve + goal effects server-side.
export function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[11px] text-faint underline"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-[11px]">
      <span className="text-faint">Delete &amp; roll back?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteManualPayment(paymentId);
            router.refresh();
          })
        }
        className="font-semibold text-red disabled:opacity-50"
      >
        Yes
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-muted">
        Cancel
      </button>
    </span>
  );
}
