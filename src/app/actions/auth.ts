"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { SignupSchema, LoginSchema } from "@/lib/validation";
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

  // Optional school access code links the user to a school (spec §2.1).
  let schoolId: string | undefined;
  if (accessCode) {
    const code = await prisma.accessCode.findUnique({ where: { code: accessCode } });
    if (!code || !code.active) {
      return { errors: { accessCode: ["That access code isn't valid."] } };
    }
    schoolId = code.schoolId;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, hashedPassword, schoolId },
  });

  const devVerifyUrl = await issueVerification(email);
  return {
    ok: true,
    message: "Account created. Check your email to verify your address.",
    devVerifyUrl,
  };
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
