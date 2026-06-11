"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  usePlaidLink,
  type PlaidLinkOnSuccessMetadata,
} from "react-plaid-link";
import { exchangePublicToken } from "@/app/actions/plaid";

// Opens Plaid Link (sandbox). Fetches a link token, exchanges the public token
// server-side on success, then refreshes the route to show synced data.
export function PlaidLinkButton({
  className,
  children,
  onLinked,
}: {
  className?: string;
  children: React.ReactNode;
  onLinked?: () => void;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/plaid/link-token", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.link_token) setToken(d.link_token);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const onSuccess = useCallback(
    async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      setBusy(true);
      try {
        await exchangePublicToken(
          publicToken,
          metadata.institution?.name ?? null,
          metadata.institution?.institution_id ?? null,
        );
        onLinked?.();
        router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [onLinked, router],
  );

  const { open, ready } = usePlaidLink({ token, onSuccess });

  return (
    <button
      type="button"
      onClick={() => open()}
      disabled={!ready || !token || busy}
      className={className}
    >
      {busy ? "Linking…" : children}
    </button>
  );
}
