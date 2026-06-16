import "dotenv/config";
import { randomInt } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Mints unique, single-use access codes for a school and prints them, so an
// athletic department can hand one to each athlete.
//
//   npm run gen:codes -- "<School Name>" <count> [PREFIX]
//   e.g. npm run gen:codes -- "University of Miami Athletics" 30 MIA

// No ambiguous characters (no 0/O/1/I/L) so codes are easy to read aloud/type.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randCode(prefix: string, len = 8): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${s}`;
}

const args = process.argv.slice(2);
const schoolName = args[0] ?? "University of Miami Athletics";
const count = Number(args[1] ?? 10);
const prefix =
  (args[2] ?? schoolName.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()) || "PB";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  let school = await prisma.school.findFirst({ where: { name: schoolName } });
  school ??= await prisma.school.create({ data: { name: schoolName } });

  const codes: string[] = [];
  while (codes.length < count) {
    const code = randCode(prefix);
    try {
      await prisma.accessCode.create({ data: { code, schoolId: school.id } });
      codes.push(code);
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") continue; // unique collision — retry
      throw e;
    }
  }

  console.log(`Generated ${codes.length} single-use codes for "${schoolName}":`);
  for (const c of codes) console.log("  " + c);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
