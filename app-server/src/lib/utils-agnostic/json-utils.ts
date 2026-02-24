/** JSON primitive values (leaf types) */
export type JsonPrimitiveValue = string | number | boolean | null;

/** Any valid JSON value (recursive) */
export type JsonValue =
  | JsonPrimitiveValue
  | JsonValue[]
  | { [key: string]: JsonValue };

/** JSON array - array of JSON values */
export type JsonArray = JsonValue[];

/** JSON object - string keys to JSON values */
export type JsonObject = Record<string, JsonValue>;

/**
 * Recursively converts unknown values to JsonValue. Non-serializable values
 * (undefined, functions, symbols, BigInt, class instances) are stringified.
 */
export function toJsonValue(value: unknown): JsonValue {
  if (value === null) return null;
  if (value === undefined) return '[undefined]';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const result: Record<string, JsonValue> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = toJsonValue(v);
    }
    return result;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Ensures a record is a valid JsonObject by converting all values. */
export function toJsonObject(obj: Record<string, unknown>): JsonObject {
  const result: JsonObject = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = toJsonValue(v);
  }
  return result;
}
