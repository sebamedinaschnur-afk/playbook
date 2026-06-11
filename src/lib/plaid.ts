import "server-only";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";
import { env } from "@/lib/env";

// Plaid client — SANDBOX only for the MVP (spec §2.2). Config is structured so
// swapping to development/production is a .env change (PLAID_ENV), not a code change.
let client: PlaidApi | null = null;

export function plaid(): PlaidApi {
  if (client) return client;
  const basePath =
    PlaidEnvironments[env.plaidEnv() as keyof typeof PlaidEnvironments] ??
    PlaidEnvironments.sandbox;
  const configuration = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": env.plaidClientId(),
        "PLAID-SECRET": env.plaidSecret(),
      },
    },
  });
  client = new PlaidApi(configuration);
  return client;
}

// Transactions only (Balance is available without being a requested product).
// We deliberately do NOT request Auth or Identity (spec §2.2).
export const PLAID_PRODUCTS = [Products.Transactions];
export const PLAID_COUNTRY_CODES = [CountryCode.Us];
