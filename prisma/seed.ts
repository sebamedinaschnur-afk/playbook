import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Seeds the hardcoded test school + access code (spec §2.1, e.g. CANES26).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SCHOOLS: { name: string; codes: string[] }[] = [
  { name: "University of Miami Athletics", codes: ["CANES26"] },
];

// Quarterly estimated-tax due dates (addendum §8). Statutory (nominal) dates;
// the weekend/holiday → next-business-day adjustment is applied on read.
// NOTE: review/extend these annually.
const TAX_YEARS = [2026, 2027];
function quarterlyDatesFor(taxYear: number) {
  return [
    { quarter: 1, statutoryDate: new Date(Date.UTC(taxYear, 3, 15)) }, // Apr 15
    { quarter: 2, statutoryDate: new Date(Date.UTC(taxYear, 5, 15)) }, // Jun 15
    { quarter: 3, statutoryDate: new Date(Date.UTC(taxYear, 8, 15)) }, // Sep 15
    { quarter: 4, statutoryDate: new Date(Date.UTC(taxYear + 1, 0, 15)) }, // Jan 15 next year
  ];
}

async function main() {
  for (const s of SCHOOLS) {
    const school = await prisma.school.upsert({
      where: { id: `seed-${s.name}` },
      // upsert needs a unique key; School has no natural unique besides id, so
      // we find-or-create by name instead.
      update: {},
      create: { id: `seed-${s.name}`, name: s.name },
    });
    for (const code of s.codes) {
      await prisma.accessCode.upsert({
        where: { code },
        update: { active: true, schoolId: school.id },
        create: { code, schoolId: school.id, active: true },
      });
      console.log(`Seeded access code ${code} -> ${s.name}`);
    }
  }

  for (const taxYear of TAX_YEARS) {
    for (const { quarter, statutoryDate } of quarterlyDatesFor(taxYear)) {
      await prisma.quarterlyTaxDate.upsert({
        where: { taxYear_quarter: { taxYear, quarter } },
        update: { statutoryDate },
        create: { taxYear, quarter, statutoryDate },
      });
    }
    console.log(`Seeded quarterly tax dates for tax year ${taxYear}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
