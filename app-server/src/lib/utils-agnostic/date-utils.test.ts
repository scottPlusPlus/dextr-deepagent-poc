import { parseDateUnstructured } from "./date-utils";

describe("parseDateUnstructured", () => {
  const currentYear = new Date().getFullYear();

  describe("ISO / year-first formats", () => {
    test("parses YYYY-MM-DD", () => {
      expect(parseDateUnstructured("2026-01-01")).toEqual({
        year: 2026,
        month: 1,
        date: 1,
      });
    });

    test("parses YYYY/MM/DD", () => {
      expect(parseDateUnstructured("2026/01/15")).toEqual({
        year: 2026,
        month: 1,
        date: 15,
      });
    });

    test("parses single-digit month and date", () => {
      expect(parseDateUnstructured("2026-1-3")).toEqual({
        year: 2026,
        month: 1,
        date: 3,
      });
    });

    test("parses YYYY.MM.DD with dot separator", () => {
      expect(parseDateUnstructured("2026.01.23")).toEqual({
        year: 2026,
        month: 1,
        date: 23,
      });
    });

    test("parses YYYY / MM / DD with spaces around separators", () => {
      expect(parseDateUnstructured("2026 / 01 / 23 ")).toEqual({
        year: 2026,
        month: 1,
        date: 23,
      });
    });
  });

  describe("US style MM/DD/YYYY", () => {
    test("parses MM/DD/YYYY", () => {
      expect(parseDateUnstructured("01/01/2026")).toEqual({
        year: 2026,
        month: 1,
        date: 1,
      });
    });

    test("parses MM-DD-YYYY", () => {
      expect(parseDateUnstructured("12-25-2026")).toEqual({
        year: 2026,
        month: 12,
        date: 25,
      });
    });

    test("parses single-digit month and date in US format", () => {
      expect(parseDateUnstructured("3/5/2026")).toEqual({
        year: 2026,
        month: 3,
        date: 5,
      });
    });
  });

  describe("month name + day (assumes current year)", () => {
    test("parses Jan 1", () => {
      const result = parseDateUnstructured("Jan 1");
      expect(result).toEqual({
        year: currentYear,
        month: 1,
        date: 1,
      });
    });

    test("parses January 15", () => {
      const result = parseDateUnstructured("January 15");
      expect(result).toEqual({
        year: currentYear,
        month: 1,
        date: 15,
      });
    });

    test("parses Dec 31", () => {
      const result = parseDateUnstructured("Dec 31");
      expect(result).toEqual({
        year: currentYear,
        month: 12,
        date: 31,
      });
    });
  });

  describe("month name + day with ordinals", () => {
    test("parses Jan 3rd", () => {
      const result = parseDateUnstructured("Jan 3rd");
      expect(result).toEqual({
        year: currentYear,
        month: 1,
        date: 3,
      });
    });

    test("parses Jan 1st", () => {
      const result = parseDateUnstructured("Jan 1st");
      expect(result).toEqual({
        year: currentYear,
        month: 1,
        date: 1,
      });
    });

    test("parses Feb 2nd", () => {
      const result = parseDateUnstructured("Feb 2nd");
      expect(result).toEqual({
        year: currentYear,
        month: 2,
        date: 2,
      });
    });

    test("parses Mar 21st", () => {
      const result = parseDateUnstructured("Mar 21st");
      expect(result).toEqual({
        year: currentYear,
        month: 3,
        date: 21,
      });
    });
  });

  describe("month name + day + year", () => {
    test("parses Jan 3rd 2026", () => {
      expect(parseDateUnstructured("Jan 3rd 2026")).toEqual({
        year: 2026,
        month: 1,
        date: 3,
      });
    });

    test("parses January 15 2025", () => {
      expect(parseDateUnstructured("January 15 2025")).toEqual({
        year: 2025,
        month: 1,
        date: 15,
      });
    });

    test("parses Dec 31st 2030", () => {
      expect(parseDateUnstructured("Dec 31st 2030")).toEqual({
        year: 2030,
        month: 12,
        date: 31,
      });
    });
  });

  describe("flexible spacing", () => {
    test("trims leading and trailing whitespace", () => {
      expect(parseDateUnstructured("  2026-01-01  ")).toEqual({
        year: 2026,
        month: 1,
        date: 1,
      });
    });

    test("collapses multiple spaces between tokens", () => {
      const result = parseDateUnstructured("Jan    3rd   2026");
      expect(result).toEqual({
        year: 2026,
        month: 1,
        date: 3,
      });
    });
  });

  describe("day before month (e.g. 3rd Jan)", () => {
    test("parses 3rd Jan", () => {
      const result = parseDateUnstructured("3rd Jan");
      expect(result).toEqual({
        year: currentYear,
        month: 1,
        date: 3,
      });
    });

    test("parses 15 January 2026", () => {
      expect(parseDateUnstructured("15 January 2026")).toEqual({
        year: 2026,
        month: 1,
        date: 15,
      });
    });
  });

  describe("invalid inputs", () => {
    test("returns null for empty string", () => {
      expect(parseDateUnstructured("")).toBeNull();
    });

    test("returns null for whitespace-only string", () => {
      expect(parseDateUnstructured("   ")).toBeNull();
    });

    test("returns null for invalid date string", () => {
      expect(parseDateUnstructured("not a date")).toBeNull();
    });

    test("returns null for invalid month", () => {
      expect(parseDateUnstructured("2026-13-01")).toBeNull();
    });
  });
});
