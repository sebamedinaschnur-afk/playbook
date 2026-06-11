"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshData } from "@/app/actions/plaid";

// Manual "Refresh" + a silent sync-on-open (spec §2.2: sync on login and via refresh).
export function RefreshControl() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const didAuto = useRef(false);

  useEffect(() => {
    if (didAuto.current) return;
    didAuto.current = true;
    let active = true;
    refreshData()
      .then(() => {
        if (active) router.refresh();
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

  async function manualRefresh() {
    setBusy(true);
    try {
      await refreshData();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={manualRefresh}
      disabled={busy}
      className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-medium text-muted disabled:opacity-50"
    >
      {busy ? "Syncing…" : "Refresh"}
    </button>
  );
}
