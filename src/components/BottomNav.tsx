"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Tab = { href: string; label: string; icon: ReactNode };

const TABS: Tab[] = [
  {
    href: "/home",
    label: "Home",
    icon: <path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z" />,
  },
  {
    href: "/money",
    label: "Money",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M9.5 10c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7c0 2.4-5 1.6-5 4 0 1 1 1.7 2.5 1.7s2.5-.7 2.5-1.7" />
      </>
    ),
  },
  {
    href: "/alerts",
    label: "Alerts",
    icon: (
      <>
        <path d="M12 5a5 5 0 0 1 5 5v3l1.7 2.5H5.3L7 13v-3a5 5 0 0 1 5-5z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </>
    ),
  },
  {
    href: "/goals",
    label: "Goals",
    icon: (
      <>
        <path d="M4 19 L4 5" />
        <path d="M4 19 L20 19" />
        <path d="M6 15 C 10 15, 11 8, 18 7" />
      </>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
      </>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md border-t border-line bg-[#0c1014] px-1 pb-4 pt-2.5">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-label={t.label}
            className={`flex flex-1 flex-col items-center gap-1 text-[10px] ${
              active ? "font-medium text-green" : "text-faint"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[21px] w-[21px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {t.icon}
            </svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
