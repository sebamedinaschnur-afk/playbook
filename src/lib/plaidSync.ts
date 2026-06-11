import "server-only";
import type { Transaction as PlaidTransaction } from "plaid";
import { plaid } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

// Pull balances + transactions for a single PlaidItem (spec §2.2). Poll-on-demand;
// no webhooks in MVP. Uses /transactions/sync with a stored cursor for incrementals.

function categoryOf(t: PlaidTransaction): string | null {
  return t.personal_finance_category?.primary ?? t.category?.[0] ?? null;
}

// Transfers between the user's own accounts should be excluded from spend (spec §2.3).
function isTransfer(t: PlaidTransaction): boolean {
  const pfc = t.personal_finance_category?.primary ?? "";
  if (pfc === "TRANSFER_IN" || pfc === "TRANSFER_OUT") return true;
  return (t.category ?? []).includes("Transfer");
}

export async function syncPlaidItem(plaidItemId: string): Promise<void> {
  const item = await prisma.plaidItem.findUnique({ where: { id: plaidItemId } });
  if (!item) return;
  const accessToken = decrypt(item.accessTokenEnc);

  // 1. Accounts + balances
  const acctRes = await plaid().accountsGet({ access_token: accessToken });
  for (const a of acctRes.data.accounts) {
    const common = {
      name: a.name,
      officialName: a.official_name ?? null,
      mask: a.mask ?? null,
      type: a.type ?? null,
      subtype: a.subtype ?? null,
      currentBalance: a.balances.current ?? null,
      availableBalance: a.balances.available ?? null,
      isoCurrencyCode: a.balances.iso_currency_code ?? null,
      institutionName: item.institutionName,
    };
    await prisma.account.upsert({
      where: { plaidAccountId: a.account_id },
      update: common,
      create: {
        ...common,
        userId: item.userId,
        plaidItemId: item.id,
        plaidAccountId: a.account_id,
      },
    });
  }

  const accounts = await prisma.account.findMany({ where: { plaidItemId: item.id } });
  const acctMap = new Map(accounts.map((a) => [a.plaidAccountId, a.id]));

  // 2. Transactions (incremental sync). Tolerate sandbox not-ready on first try.
  let cursor = item.transactionsCursor ?? undefined;
  const added: PlaidTransaction[] = [];
  const modified: PlaidTransaction[] = [];
  const removed: string[] = [];
  try {
    let hasMore = true;
    while (hasMore) {
      const res = await plaid().transactionsSync({
        access_token: accessToken,
        cursor,
      });
      added.push(...res.data.added);
      modified.push(...res.data.modified);
      removed.push(...res.data.removed.map((r) => r.transaction_id).filter((id): id is string => !!id));
      hasMore = res.data.has_more;
      cursor = res.data.next_cursor;
    }
  } catch {
    // Product not ready yet (common right after linking in sandbox) — next refresh picks it up.
    return;
  }

  for (const t of [...added, ...modified]) {
    const accountId = acctMap.get(t.account_id);
    if (!accountId) continue;
    const data = {
      amount: t.amount,
      name: t.name,
      merchantName: t.merchant_name ?? null,
      category: categoryOf(t),
      pending: t.pending,
      isTransfer: isTransfer(t),
      date: new Date(t.date),
      isoCurrencyCode: t.iso_currency_code ?? null,
    };
    await prisma.transaction.upsert({
      where: { plaidTransactionId: t.transaction_id },
      update: data,
      create: {
        ...data,
        userId: item.userId,
        accountId,
        plaidTransactionId: t.transaction_id,
      },
    });
  }

  if (removed.length) {
    await prisma.transaction.deleteMany({
      where: { plaidTransactionId: { in: removed } },
    });
  }

  await prisma.plaidItem.update({
    where: { id: item.id },
    data: { transactionsCursor: cursor },
  });
}

export async function syncAllForUser(userId: string): Promise<void> {
  const items = await prisma.plaidItem.findMany({ where: { userId } });
  for (const it of items) {
    await syncPlaidItem(it.id);
  }
}
