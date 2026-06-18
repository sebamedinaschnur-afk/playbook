// Quarterly estimated-tax date handling (addendum §8). Pure + unit-tested.
// Statutory dates are stored as data (QuarterlyTaxDate table); the effective
// deadline shifts to the next business day if the statutory date is a weekend or
// US federal holiday. Dates are handled in UTC to match the seeded Date.UTC values.
//
// NOTE: the federal holiday set needs annual review (and does not encode DC's
// Emancipation Day, which can shift the April deadline — revisit before launch).

const DAY_MS = 86_400_000;

export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * DAY_MS);
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isWeekend(d: Date): boolean {
  const w = d.getUTCDay();
  return w === 0 || w === 6;
}

function nthWeekdayOfMonth(year: number, monthIdx: number, weekday: number, n: number): Date {
  const first = new Date(Date.UTC(year, monthIdx, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, monthIdx, 1 + offset + (n - 1) * 7));
}

function lastWeekdayOfMonth(year: number, monthIdx: number, weekday: number): Date {
  const last = new Date(Date.UTC(year, monthIdx + 1, 0));
  const back = (last.getUTCDay() - weekday + 7) % 7;
  return new Date(Date.UTC(year, monthIdx, last.getUTCDate() - back));
}

// Federal "observed" shift for fixed-date holidays: Sat → Fri, Sun → Mon.
function observed(d: Date): Date {
  const w = d.getUTCDay();
  if (w === 6) return addDays(d, -1);
  if (w === 0) return addDays(d, 1);
  return d;
}

export function usFederalHolidays(year: number): Set<string> {
  const set = new Set<string>();
  const fixed: [number, number][] = [
    [0, 1], // New Year's Day
    [5, 19], // Juneteenth
    [6, 4], // Independence Day
    [10, 11], // Veterans Day
    [11, 25], // Christmas
  ];
  for (const [m, day] of fixed) {
    const d = new Date(Date.UTC(year, m, day));
    set.add(iso(d));
    set.add(iso(observed(d))); // observed weekday
  }
  set.add(iso(nthWeekdayOfMonth(year, 0, 1, 3))); // MLK — 3rd Mon Jan
  set.add(iso(nthWeekdayOfMonth(year, 1, 1, 3))); // Presidents — 3rd Mon Feb
  set.add(iso(lastWeekdayOfMonth(year, 4, 1))); // Memorial — last Mon May
  set.add(iso(nthWeekdayOfMonth(year, 8, 1, 1))); // Labor — 1st Mon Sep
  set.add(iso(nthWeekdayOfMonth(year, 9, 1, 2))); // Columbus — 2nd Mon Oct
  set.add(iso(nthWeekdayOfMonth(year, 10, 4, 4))); // Thanksgiving — 4th Thu Nov
  return set;
}

// Returns the same date if it's a business day, else the next business day.
export function nextBusinessDay(date: Date, holidays: Set<string>): Date {
  let d = date;
  while (isWeekend(d) || holidays.has(iso(d))) d = addDays(d, 1);
  return d;
}

export function effectiveDueDate(statutory: Date, holidays: Set<string>): Date {
  return nextBusinessDay(statutory, holidays);
}

// The first effective due date for which `now` is within the prior 30 days.
export function upcomingDueDate(effectiveDates: Date[], now: Date): Date | null {
  for (const due of effectiveDates) {
    if (now >= addDays(due, -30) && now <= due) return due;
  }
  return null;
}
