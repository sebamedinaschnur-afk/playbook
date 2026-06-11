import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost" | "brass";

const base =
  "block w-full rounded-xl px-4 py-3 text-center font-display text-sm font-semibold transition active:scale-[.98] disabled:opacity-40 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  primary: "bg-green text-[#08251a]",
  ghost: "bg-transparent text-green border border-[#2c5946]",
  brass: "bg-brass text-[#231a05]",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string[];
  children: ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs text-muted">
        {label}
      </label>
      {children}
      {error?.length ? <p className="mt-1.5 text-xs text-red">{error[0]}</p> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-panel px-3.5 py-3 text-sm text-ink outline-none focus:border-green placeholder:text-faint";

export function Disclaimer({ children }: { children: ReactNode }) {
  return <p className="mt-2.5 text-[11px] leading-relaxed text-faint">{children}</p>;
}

export function FormMessage({ ok, children }: { ok?: boolean; children: ReactNode }) {
  return (
    <p className={`mb-3 text-sm ${ok ? "text-green" : "text-red"}`}>{children}</p>
  );
}
