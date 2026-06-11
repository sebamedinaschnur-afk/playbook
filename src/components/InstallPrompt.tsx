"use client";

import { useEffect, useState } from "react";

// Dismissible "install to home screen" hint (spec §2.7). iOS gets manual
// instructions (no beforeinstallprompt on Safari); Chromium gets the native prompt.
type BIPEvent = Event & { prompt: () => Promise<void> };

const DISMISS_KEY = "pb_install_dismissed";

type Env = { isIOS: boolean; standalone: boolean; dismissed: boolean };

export function InstallPrompt() {
  // Null until mounted, so the first client render matches the server (renders nothing)
  // and we avoid a hydration mismatch from reading browser-only APIs.
  const [env, setEnv] = useState<Env | null>(null);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client init
    setEnv({
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      standalone: window.matchMedia("(display-mode: standalone)").matches,
      dismissed: localStorage.getItem(DISMISS_KEY) === "1",
    });

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!env || env.standalone || env.dismissed) return null;
  if (!env.isIOS && !deferred) return null; // nothing actionable to show

  function close() {
    localStorage.setItem(DISMISS_KEY, "1");
    setEnv((e) => (e ? { ...e, dismissed: true } : e));
  }

  async function install() {
    if (deferred) {
      await deferred.prompt();
      close();
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-green-border bg-green-tint p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-green">Install Playbook</p>
          {env.isIOS ? (
            <p className="mt-1 text-xs text-muted">
              Tap the Share button, then “Add to Home Screen” to install.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              Add Playbook to your home screen for an app-like experience.
            </p>
          )}
        </div>
        <button onClick={close} aria-label="Dismiss" className="flex-none text-faint">
          ✕
        </button>
      </div>
      {!env.isIOS && deferred ? (
        <button
          onClick={install}
          className="mt-3 rounded-lg bg-green px-3 py-1.5 text-sm font-semibold text-[#08251a]"
        >
          Add to home screen
        </button>
      ) : null}
    </div>
  );
}
