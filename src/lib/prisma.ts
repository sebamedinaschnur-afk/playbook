// Prisma 7 requires a driver adapter for a direct DB connection.
// Singleton pattern so Next.js dev hot-reload doesn't open a new pool each time.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Silence node-postgres' future-deprecation notice about `sslmode=require`
// (it's treated as verify-full today). Harmless now, but Next's dev overlay
// surfaces process warnings as errors. Scoped to this exact message only.
const originalEmitWarning = process.emitWarning.bind(process);
process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
  const text = typeof warning === "string" ? warning : warning?.message;
  if (text && text.includes("SSL modes") && text.includes("verify-full")) return;
  return (originalEmitWarning as (...a: unknown[]) => void)(warning, ...args);
}) as typeof process.emitWarning;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
