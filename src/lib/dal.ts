import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

// Data Access Layer (Next.js 16 auth guide pattern). Centralises the auth check
// so every data request verifies the session. cache() de-dupes within a render.

export const verifySession = cache(async () => {
  const session = await getSessionPayload();
  if (!session?.userId) {
    redirect("/login");
  }
  return { userId: session.userId };
});

// Returns the userId if logged in, else null — does NOT redirect.
// Use in places that need to branch (e.g. proxy, public pages).
export const optionalSession = cache(async () => {
  const session = await getSessionPayload();
  return session?.userId ?? null;
});

// Full current user record (after verifying session). Redirects to /login if absent.
export const getCurrentUser = cache(async () => {
  const { userId } = await verifySession();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true },
  });
  if (!user) {
    // Session points at a deleted user — treat as logged out.
    redirect("/login");
  }
  return user;
});
