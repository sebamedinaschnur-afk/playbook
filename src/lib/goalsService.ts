import "server-only";
import { prisma } from "@/lib/prisma";
import { templateFor } from "@/lib/goalTemplates";
import { goalSaved } from "@/lib/goals";

export type GoalWithSaved = {
  id: string;
  title: string;
  category: string;
  emoji: string;
  targetAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  saved: number; // SUM(allocations), computed on read
};

// Goals with their saved amount summed from GoalAllocation rows (addendum §3.2).
export async function getGoalsWithSaved(userId: string): Promise<GoalWithSaved[]> {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { allocations: { select: { amount: true } } },
  });
  return goals.map((g) => ({
    id: g.id,
    title: g.title,
    category: g.category,
    emoji: templateFor(g.category).emoji,
    targetAmount: g.targetAmount,
    targetDate: g.targetDate,
    monthlyContribution: g.monthlyContribution,
    saved: goalSaved(g.allocations.map((a) => a.amount)),
  }));
}
