import "server-only";
import { prisma } from "@/lib/prisma";
import { effectiveDueDate, usFederalHolidays } from "@/lib/quarterlyTax";

// Reads the seeded statutory dates and returns business-day-adjusted effective
// due dates, ascending (addendum §8). Not hardcoded — sourced from the table.
export async function getEffectiveDueDates(): Promise<Date[]> {
  const rows = await prisma.quarterlyTaxDate.findMany({ orderBy: { statutoryDate: "asc" } });
  const holidaysByYear = new Map<number, Set<string>>();
  const holidaysFor = (y: number) => {
    if (!holidaysByYear.has(y)) holidaysByYear.set(y, usFederalHolidays(y));
    return holidaysByYear.get(y)!;
  };
  return rows.map((r) => {
    const y = r.statutoryDate.getUTCFullYear();
    // Merge this year + next so an adjustment crossing a year boundary still resolves.
    const holidays = new Set([...holidaysFor(y), ...holidaysFor(y + 1)]);
    return effectiveDueDate(r.statutoryDate, holidays);
  });
}
