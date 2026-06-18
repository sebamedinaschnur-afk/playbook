import { z } from "zod";

// Server-side validation schemas (spec §4 — "Server-side validation on every endpoint").

export const SignupSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .max(200),
  accessCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export const LoginSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Password is required." }),
});

// Input-payment addendum: manual payment entry (spec §4.2).
export const MANUAL_PAYMENT_KINDS = ["NIL_DEAL", "OTHER_INCOME"] as const;
export const PAYMENT_METHODS = ["CASH", "APP", "COLLECTIVE", "CHECK"] as const;

export const ManualPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ error: "Enter an amount greater than $0." })
    .max(10_000_000),
  kind: z.enum(MANUAL_PAYMENT_KINDS),
  method: z.enum(PAYMENT_METHODS),
  payer: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

// School path: a non-empty access code, normalised (trimmed + uppercased).
export const SchoolCodeSchema = z.object({
  accessCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, { error: "Enter your school code." }),
});

export const SPORTS = [
  "Football",
  "Basketball",
  "Baseball",
  "Soccer",
  "Track",
  "Other",
] as const;

export const YEARS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Pro",
] as const;

export const PAYMENT_CHANNELS = [
  "direct_deposit",
  "school_collective",
  "cash_venmo",
] as const;

export const OnboardingSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }).max(120),
  sport: z.enum(SPORTS),
  year: z.enum(YEARS),
  careerHorizonYears: z.coerce.number().int().min(1).max(12),
  hasNilDeals: z.coerce.boolean(),
  estMonthlyNil: z.coerce.number().int().min(0).max(1_000_000),
  paymentChannels: z.array(z.enum(PAYMENT_CHANNELS)).default([]),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

// Goals — "Next Season" planning.
export const GOAL_CATEGORIES = [
  "HOME",
  "BUSINESS",
  "EDUCATION",
  "FAMILY",
  "INDEPENDENCE",
  "REAL_ESTATE",
  "OTHER",
] as const;

export const GoalCreateSchema = z.object({
  title: z.string().trim().min(1, { error: "Give your goal a name." }).max(120),
  category: z.enum(GOAL_CATEGORIES),
  targetAmount: z.coerce.number().positive({ error: "Set a target amount." }).max(100_000_000),
  targetDate: z.coerce.date(),
  monthlyContribution: z.coerce.number().min(0).max(1_000_000),
  currentSaved: z.coerce.number().min(0).max(100_000_000),
});

// Settings: edit the three generated rules (spec §2.4).
export const RulesUpdateSchema = z.object({
  taxSetAsidePct: z.coerce.number().min(0).max(100),
  monthlySavings: z.coerce.number().min(0).max(1_000_000),
  spendingThreshold: z.coerce.number().min(0).max(1_000_000),
});
