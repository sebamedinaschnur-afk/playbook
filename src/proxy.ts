import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// Next.js 16 renamed `middleware` -> `proxy` (Node.js runtime). This does an
// OPTIMISTIC auth check only (reads the cookie, no DB) per the Next auth guide;
// real authorization happens in the DAL close to the data.

const PUBLIC_ROUTES = new Set(["/login", "/signup", "/verify", "/verify-sent", "/offline"]);

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return typeof payload.userId === "string";
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // The signup fork lives at /signup and its sub-paths (/signup/school, etc.) — all public.
  const isSignup = pathname === "/signup" || pathname.startsWith("/signup/");
  const isPublic = PUBLIC_ROUTES.has(pathname) || isSignup;
  const loggedIn = await hasValidSession(req);

  // Root: send to the right place.
  if (pathname === "/") {
    return NextResponse.redirect(new URL(loggedIn ? "/home" : "/login", req.nextUrl));
  }

  if (!isPublic && !loggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublic && loggedIn && (pathname === "/login" || isSignup)) {
    return NextResponse.redirect(new URL("/home", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static asset files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:png|svg|ico|webmanifest)$).*)"],
};
