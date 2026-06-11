import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { plaid, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from "@/lib/plaid";

// Creates a short-lived Plaid Link token for the logged-in user (spec §2.2).
// Auth-gated; returns 401 if not signed in.
export async function POST() {
  const session = await getSessionPayload();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const res = await plaid().linkTokenCreate({
      user: { client_user_id: session.userId },
      client_name: "Playbook",
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: "en",
    });
    return NextResponse.json({ link_token: res.data.link_token });
  } catch {
    return NextResponse.json({ error: "Could not create link token" }, { status: 500 });
  }
}
