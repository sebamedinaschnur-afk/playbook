"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { GoalCreateSchema } from "@/lib/validation";

export type GoalState = { ok?: boolean; errors?: Record<string, string[]> } | undefined;

export async function createGoal(_state: GoalState, formData: FormData): Promise<GoalState> {
  const { userId } = await verifySession();

  const parsed = GoalCreateSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate"),
    monthlyContribution: formData.get("monthlyContribution"),
    currentSaved: formData.get("currentSaved"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.goal.create({ data: { userId, ...parsed.data } });
  revalidatePath("/goals");
  return { ok: true };
}

export async function deleteGoal(formData: FormData): Promise<void> {
  const { userId } = await verifySession();
  const id = String(formData.get("id") ?? "");
  // Scope the delete to the owner so users can't delete others' goals.
  await prisma.goal.deleteMany({ where: { id, userId } });
  revalidatePath("/goals");
}
