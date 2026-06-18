import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// One-off: migrate existing Goal.currentSaved into a MANUAL_ADHOC GoalAllocation,
// so allocations become the single source of truth for goal progress (addendum
// §3.2). Idempotent: skips any goal that already has allocations.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const goals = await prisma.goal.findMany({ include: { allocations: true } });
  let created = 0;
  for (const g of goals) {
    if (g.allocations.length > 0) continue; // already migrated
    if (g.currentSaved && g.currentSaved > 0) {
      await prisma.goalAllocation.create({
        data: {
          userId: g.userId,
          goalId: g.id,
          amount: g.currentSaved,
          sourceType: "MANUAL_ADHOC",
        },
      });
      created++;
    }
  }
  console.log(`Backfill complete. Allocations created from currentSaved: ${created}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
