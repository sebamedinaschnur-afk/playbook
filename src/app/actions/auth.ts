"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { SignupSchema, LoginSchema, SchoolCodeSchema } from "@/lib/validation";
import { createSession, deleteSession } from "@/lib/session";

export type AuthState =
  | {
      ok?: boolean;
      message?: string;
      // In MVP there is no email provider, so we surface the verification link
      // directly (also logged server-side). The README documents this.
      devVerifyUrl?: string;
      errors?: Record<string, string[]>;
    }
  | undefined;

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

async function issueVerification(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires: new Date(Date.now() + VERIFY_TTL_MS) },
  });
  const url = `${env.appUrl()}/verify?token=${token}`;
  // Stand-in for an email send (spec §2.1; real email is out of scope for MVP).
  console.log(`[playbook] Email verification link for ${email}: ${url}`);
  return url;
}

const CODE_INVALID =
  "That code isn't recognized. Double-check it with your athletic department, or sign up as an individual instead.";
const CODE_USED =
  "This code has already been used to activate an account. Check with your athletic department.";

// Thrown inside the redeem transaction to roll it back with a user-facing message.
class CodeError extends Error {}

export async function signup(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    accessCode: formData.get("accessCode"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { email, password, accessCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  if (accessCode) {
    // School path: redeem the SINGLE-USE code atomically while creating the
    // account, so a code can't be shared or used twice (even under a race).
    try {
      await prisma.$transaction(async (tx) => {
        const code = await tx.accessCode.findUnique({ where: { code: accessCode } });
        if (!code || !code.active) throw new CodeError(CODE_INVALID);
        if (code.redeemedById) throw new CodeError(CODE_USED);

        const user = await tx.user.create({
          data: { email, hashedPassword, schoolId: code.schoolId },
        });
        const claimed = await tx.accessCode.updateMany({
          where: { id: code.id, redeemedById: null },
          data: { redeemedById: user.id, redeemedAt: new Date() },
        });
        if (claimed.count === 0) throw new CodeError(CODE_USED); // lost the race — rolls back
      });
    } catch (e) {
      if (e instanceof CodeError) return { errors: { accessCode: [e.message] } };
      throw e;
    }
  } else {
    // Individual path: no school link.
    await prisma.user.create({ data: { email, hashedPassword } });
  }

  const devVerifyUrl = await issueVerification(email);
  return {
    ok: true,
    message: "Account created. Check your email to verify your address.",
    devVerifyUrl,
  };
}

export type SchoolCodeResult =
  | { ok: true; schoolName: string }
  | { ok: false; reason: "invalid" | "used" };

// Validates a school access code against the DB (spec §2.1). Codes are single-use,
// so an already-redeemed code is reported distinctly from an unrecognized one.
export async function validateSchoolCode(rawCode: string): Promise<SchoolCodeResult> {
  const parsed = SchoolCodeSchema.safeParse({ accessCode: rawCode });
  if (!parsed.success) return { ok: false, reason: "invalid" };

  const code = await prisma.accessCode.findUnique({
    where: { code: parsed.data.accessCode },
    include: { school: true },
  });
  if (!code || !code.active) return { ok: false, reason: "invalid" };
  if (code.redeemedById) return { ok: false, reason: "used" };
  return { ok: true, schoolName: code.school.name };
}

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-ish response: always run a compare to avoid leaking which emails exist.
  const ok = user ? await bcrypt.compare(password, user.hashedPassword) : false;
  if (!user || !ok) {
    return { message: "Incorrect email or password." };
  }
  if (!user.emailVerified) {
    return { message: "Please verify your email before logging in." };
  }

  await createSession(user.id);
  redirect(user.onboardingComplete ? "/home" : "/onboarding");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

export async function resendVerification(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Always report success to avoid email enumeration.
  if (user && !user.emailVerified) {
    const devVerifyUrl = await issueVerification(email);
    return { ok: true, message: "Verification link sent.", devVerifyUrl };
  }
  return { ok: true, message: "If that account needs verification, a link was sent." };
}
