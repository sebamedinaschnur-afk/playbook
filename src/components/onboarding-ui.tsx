"use client";

import type { ReactNode } from "react";

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5 px-1 pt-1" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full ${i < current ? "bg-green" : "bg-panel2"}`}
        />
      ))}
    </div>
  );
}

export function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-2 text-sm transition ${
        selected
          ? "border-green bg-green-tint font-medium text-green"
          : "border-line bg-panel text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function PillRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function SliderRow({
  id,
  min,
  max,
  step,
  value,
  onChange,
  format,
  label,
}: {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  label: string;
}) {
  return (
    <div className="my-2 flex items-center gap-3">
      <label htmlFor={id} className="whitespace-nowrap text-sm text-muted">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <span className="tnum min-w-[64px] text-right text-sm">{format(value)}</span>
    </div>
  );
}

export function StepHeading({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-2xl font-semibold leading-tight">{title}</h1>
      {lead ? <p className="mt-2 text-sm leading-relaxed text-muted">{lead}</p> : null}
    </div>
  );
}

export function PlayRule({ title, why }: { title: string; why: string }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-line py-3 last:border-b-0">
      <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-green" />
      <div>
        <p className="text-sm leading-snug">{title}</p>
        <p className="mt-0.5 text-xs text-faint">{why}</p>
      </div>
    </div>
  );
}
