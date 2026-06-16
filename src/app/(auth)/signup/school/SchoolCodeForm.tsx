"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validateSchoolCode } from "@/app/actions/auth";
import { Button, inputClass } from "@/components/ui";

type Check =
  | { status: "idle" | "checking" | "invalid" | "used" }
  | { status: "valid"; schoolName: string };

export function SchoolCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [check, setCheck] = useState<Check>({ status: "idle" });
  const latest = useRef("");

  // Debounced server-side validation against the AccessCode records.
  useEffect(() => {
    const c = code.trim().toUpperCase();
    latest.current = c;
    if (c.length === 0) return; // empty → idle is derived in render
    const t = setTimeout(async () => {
      setCheck({ status: "checking" });
      const res = await validateSchoolCode(c);
      if (latest.current !== c) return; // a newer keystroke superseded this check
      setCheck(
        res.ok ? { status: "valid", schoolName: res.schoolName } : { status: res.reason },
      );
    }, 400);
    return () => clearTimeout(t);
  }, [code]);

  const view: Check = code.trim().length === 0 ? { status: "idle" } : check;

  function handleContinue() {
    if (view.status !== "valid") return;
    router.push(`/signup/account?code=${encodeURIComponent(code.trim().toUpperCase())}`);
  }

  return (
    <div>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. CANES26"
        autoCapitalize="characters"
        autoComplete="off"
        className={inputClass}
      />

      {view.status === "valid" ? (
        <p className="mt-2 text-sm text-green">
          ✓ {view.schoolName} — your access is covered by your school
        </p>
      ) : view.status === "invalid" ? (
        <p className="mt-2 text-sm text-red">
          That code isn&apos;t recognized. Double-check it with your athletic department, or
          sign up as an individual instead.
        </p>
      ) : view.status === "used" ? (
        <p className="mt-2 text-sm text-red">
          This code has already been used to activate an account. Check with your athletic
          department.
        </p>
      ) : null}

      <Button
        type="button"
        onClick={handleContinue}
        disabled={view.status !== "valid"}
        className="mt-4"
      >
        {view.status === "checking" ? "Checking…" : "Continue"}
      </Button>

      <Link
        href="/signup/individual"
        className="mt-4 block text-center text-sm text-green"
      >
        Don&apos;t have a code? Sign up as an individual
      </Link>
    </div>
  );
}
