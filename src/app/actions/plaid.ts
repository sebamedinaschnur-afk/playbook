"use server";

import { revalidatePath } from "next/cache";
import { plaid } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { encrypt } from "@/lib/crypto";
import { syncPlaidItem, syncAllForUser } from "@/lib/plaidSync";
import { generateAlerts } from "@/lib/alertsService";

// Exchanges a Plaid public_token for an access_token (SERVER-SIDE ONLY, spec §4),
// stores it encrypted, then pulls accounts + transactions.
export async function exchangePublicToken(
  publicToken: string,
  institutionName: string | null,
  institutionId: string | null,
): Promise<{ ok: boolean }> {
  const { userId } = await verifySession();

  const exchange = await plaid().itemPublicTokenExchange({ public_token: publicToken });
  const accessToken = exchange.data.access_token;
  const itemId = exchange.data.item_id;

  const item = await prisma.plaidItem.upsert({
    where: { itemId },
    update: {
      accessTokenEnc: encrypt(accessToken),
      institutionName,
      institutionId,
    },
    create: {
      userId,
      itemId,
      accessTokenEnc: encrypt(accessToken),
      institutionName,
      institutionId,
    },
  });

  await syncPlaidItem(item.id);
  await generateAlerts(userId);

  revalidatePath("/money");
  revalidatePath("/home");
  revalidatePath("/alerts");
  return { ok: true };
}

// Manual "refresh" — re-pull balances + transactions for all linked items (spec §2.2).
export async function refreshData(): Promise<{ ok: boolean }> {
  const { userId } = await verifySession();
  await syncAllForUser(userId);
  await generateAlerts(userId);
  revalidatePath("/money");
  revalidatePath("/home");
  revalidatePath("/alerts");
  return { ok: true };
}
