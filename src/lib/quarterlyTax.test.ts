import { describe, it, expect } from "vitest";
import {
  usFederalHolidays,
  nextBusinessDay,
  effectiveDueDate,
  upcomingDueDate,
} from "./quarterlyTax";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const iso = (d: Date) => d.toISOString().slice(0, 10);

describe("usFederalHolidays", () => {
  it("includes fixed and floating holidays", () => {
    const h = usFederalHolidays(2026);
    expect(h.has("2026-01-01")).toBe(true); // New Year's
    expect(h.has("2026-01-19")).toBe(true); // MLK (3rd Mon Jan 2026)
    expect(h.has("2026-06-19")).toBe(true); // Juneteenth
    expect(h.has("2026-11-26")).toBe(true); // Thanksgiving (4th Thu Nov 2026)
  });

  it("adds the observed weekday for weekend fixed holidays", () => {
    // Jul 4 2026 is a Saturday → observed Friday Jul 3
    const h = usFederalHolidays(2026);
    expect(h.has("2026-07-03")).toBe(true);
  });
});

describe("nextBusinessDay / effectiveDueDate", () => {
  const h2026 = usFederalHolidays(2026);

  it("leaves a normal weekday unchanged", () => {
    // Apr 15 2026 is a Wednesday
    expect(iso(effectiveDueDate(utc(2026, 3, 15), h2026))).toBe("2026-04-15");
  });

  it("moves a weekend to the following Monday", () => {
    // Jan 15 2028 is a Saturday; MLK 2028 is Mon Jan 17 → next business day Tue Jan 18
    const h2028 = usFederalHolidays(2028);
    expect(iso(effectiveDueDate(utc(2028, 0, 15), h2028))).toBe("2028-01-18");
  });

  it("moves a holiday to the next business day", () => {
    // New Year's Day 2026 (Thu) is a holiday → Fri Jan 2
    expect(iso(nextBusinessDay(utc(2026, 0, 1), h2026))).toBe("2026-01-02");
  });
});

describe("upcomingDueDate", () => {
  const dates = [utc(2026, 3, 15), utc(2026, 5, 15), utc(2026, 8, 15)];

  it("returns the due date when now is within the prior 30 days", () => {
    expect(upcomingDueDate(dates, utc(2026, 5, 10))).toEqual(utc(2026, 5, 15));
  });

  it("returns null when not within 30 days of any due date", () => {
    expect(upcomingDueDate(dates, utc(2026, 6, 20))).toBeNull();
  });
});
