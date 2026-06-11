// Centralised env access with friendly errors. Keeps secrets out of the client bundle.
// All of these are server-only.

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy .env.example to .env and fill it in (see README).`,
    );
  }
  return v;
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  authSecret: () => required("AUTH_SECRET"),
  encryptionKey: () => required("ENCRYPTION_KEY"),
  plaidClientId: () => required("PLAID_CLIENT_ID"),
  plaidSecret: () => required("PLAID_SECRET"),
  plaidEnv: () => optional("PLAID_ENV") ?? "sandbox",
  appUrl: () => optional("APP_URL") ?? "http://localhost:3000",
};
