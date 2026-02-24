export type DateAsNums = { year: number; month: number; date: number };

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function normalizeInput(str: string): string {
  return str.trim().replace(/\s+/g, " ");
}

const SEP = "\\s*[-/.]\\s*";

function tryIsoOrYearFirst(str: string): DateAsNums | null {
  const m = str.match(new RegExp(`^(\\d{4})${SEP}(\\d{1,2})${SEP}(\\d{1,2})\\s*$`));
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const date = parseInt(m[3], 10);
  if (month < 1 || month > 12 || date < 1 || date > 31) return null;
  const result = { year, month, date };
  return result;
}

function tryUsStyle(str: string): DateAsNums | null {
  const m = str.match(new RegExp(`^(\\d{1,2})${SEP}(\\d{1,2})${SEP}(\\d{4})\\s*$`));
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const date = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (month < 1 || month > 12 || date < 1 || date > 31) return null;
  const result = { year, month, date };
  return result;
}

function tryMonthNameDayYear(str: string): DateAsNums | null {
  const m = str.match(
    /^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:(\d{4}))?$/i
  );
  if (!m) return null;
  const monthKey = m[1].toLowerCase();
  const month = MONTH_NAMES[monthKey];
  if (month == null) return null;
  const date = parseInt(m[2], 10);
  if (date < 1 || date > 31) return null;
  const year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
  const result = { year, month, date };
  return result;
}

function tryMonthNameDayYearReversed(str: string): DateAsNums | null {
  const m = str.match(
    /^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s*(?:(\d{4}))?$/i
  );
  if (!m) return null;
  const monthKey = m[2].toLowerCase();
  const month = MONTH_NAMES[monthKey];
  if (month == null) return null;
  const date = parseInt(m[1], 10);
  if (date < 1 || date > 31) return null;
  const year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
  const result = { year, month, date };
  return result;
}

function tryNativeParse(str: string): DateAsNums | null {
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  const result = {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    date: d.getDate(),
  };
  return result;
}

export function parseDateUnstructured(str: string): DateAsNums | null {
  if (typeof str !== "string" || str.trim() === "") return null;
  const normalized = normalizeInput(str);

  const strategies: Array<(s: string) => DateAsNums | null> = [
    tryIsoOrYearFirst,
    tryUsStyle,
    tryMonthNameDayYear,
    tryMonthNameDayYearReversed,
    tryNativeParse,
  ];

  for (const fn of strategies) {
    const result = fn(normalized);
    if (result != null) return result;
  }

  return null;
}
