import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Seeds the hardcoded test school + access code (spec §2.1, e.g. CANES26).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SCHOOLS: { name: string; codes: string[] }[] = [
  { name: "University of Miami Athletics", codes: ["CANES26"] },
];

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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
