"use client";

import { useEffect } from "react";

// Registers the offline-shell service worker. Production only — registering in
// dev fights Turbopack HMR and serves stale assets.
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Registration failures are non-fatal — the app still works online.
    });
  }, []);
  return null;
}
