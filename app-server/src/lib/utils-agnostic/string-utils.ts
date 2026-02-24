/**
 * Returns substrings of `str` containing each occurrence of `query` plus
 * `contextLength` characters on either side. Overlapping segments are merged.
 * Non-overlapping chunks are joined with "... ". If query is not found,
 * returns the full string.
 */
export function findInStringWithContext(
  str: string,
  query: string,
  contextLength: number,
): string {
  if (query === "") return str;

  const indices: number[] = [];
  let pos = 0;
  while (true) {
    const idx = str.indexOf(query, pos);
    if (idx === -1) break;
    indices.push(idx);
    pos = idx + 1;
  }
  if (indices.length === 0) return str;

  const segments: [number, number][] = indices.map((idx) => [
    Math.max(0, idx - contextLength),
    Math.min(str.length, idx + query.length + contextLength),
  ]);

  const merged: [number, number][] = [];
  for (const [start, end] of segments) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  return merged.map(([s, e]) => str.slice(s, e).trim()).join("... ");
}

/**
 * Like findInStringWithContext but accepts multiple queries.
 * Finds all occurrences of any query, merges overlapping segments, returns joined context.
 * Empty queries array returns full string.
 */
export function findInStringWithContextMulti(
  str: string,
  queries: string[],
  contextLength: number,
): string {
  const segments: [number, number][] = [];
  for (const query of queries) {
    if (query === "") continue;
    let pos = 0;
    while (true) {
      const idx = str.indexOf(query, pos);
      if (idx === -1) break;
      segments.push([
        Math.max(0, idx - contextLength),
        Math.min(str.length, idx + query.length + contextLength),
      ]);
      pos = idx + 1;
    }
  }
  if (segments.length === 0) return str;

  segments.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of segments) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  return merged.map(([s, e]) => str.slice(s, e).trim()).join("... ");
}

export function truncateString(str: string, maxLength: number, suffix: string = "..."): string {
  if (str.length <= maxLength) {
    return str;
  }
  const cutAt = Math.max(0, maxLength - suffix.length);
  const result = str.slice(0, cutAt) + suffix;
  return result;
}
