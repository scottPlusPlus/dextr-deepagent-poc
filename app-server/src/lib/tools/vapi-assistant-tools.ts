import { dextrInternFetch } from '../dextr-intern-utils';
import { toJsonObject, type JsonObject } from '../utils-agnostic/json-utils';
import { findInStringWithContextMulti } from '../utils-agnostic/string-utils';

export type ResultOrHumanErr<T> =
  | { success: true; data: T }
  | { success: false; err: string };

/**
 * Returns all Vapi Assistants whose id or name matches the input query
 * ex: "Henderson" would return tools "Henderson Prod" and "Henderson Dev"
 * @param toolQuery 
 * @returns 
 */
export async function getAssistantByNameOrId(
  nameOrIdQuery: string,
  extractPromptQuery?: string,
  extractPromptContextLength?: number,
): Promise<ResultOrHumanErr<JsonObject[]>> {
  console.debug(`getAssistantByNameOrId: ${nameOrIdQuery}, extractPromptQuery: ${extractPromptQuery ?? '(none)'}`);
  const trimmed = nameOrIdQuery.trim();
  if (!trimmed) {
    return { success: false, err: 'Name or ID is required' };
  }
  try {
    const res = await dextrInternFetch(
      `/api/vapi/assistant-by-name?name=${encodeURIComponent(trimmed)}`,
    );
    if (!res.ok) {
      const text = await res.text();
      return { success: false, err: text || `HTTP ${res.status}` };
    }
    const raw = await res.json();
    const parsed = parseJsonObjectArray(raw);
    const queries = parseExtractPromptQueries(extractPromptQuery?.trim() ?? '');
    if (parsed.success && queries.length > 0 && extractPromptContextLength !== undefined && extractPromptContextLength >= 0) {
      parsed.data = extractPromptContextInAssistants(
        parsed.data,
        queries,
        extractPromptContextLength,
        true,
      );
    }
    return parsed;
  } catch (e) {
    return {
      success: false,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Returns all Vapi Assistants who have a tool that matches the query
 * Checks tool id, name, url
 * @param toolQuery 
 * @returns 
 */
export async function getAssistantByTool(
  toolQuery: string,
  extractPromptQuery?: string,
  extractPromptContextLength?: number,
): Promise<ResultOrHumanErr<JsonObject[]>> {
  console.debug(`getAssistantByTool: ${toolQuery}, extractPromptQuery: ${extractPromptQuery ?? '(none)'}`);
  const trimmed = toolQuery.trim();
  if (!trimmed) {
    return { success: false, err: 'Tool name is required' };
  }
  try {
    const res = await dextrInternFetch(
      `/api/vapi/assistant-by-tool?tool=${encodeURIComponent(trimmed)}`,
    );
    if (!res.ok) {
      const text = await res.text();
      return { success: false, err: text || `HTTP ${res.status}` };
    }
    const raw = await res.json();
    const parsed = parseJsonObjectArray(raw);
    const queries = parseExtractPromptQueries(extractPromptQuery?.trim() ?? '');
    if (parsed.success && queries.length > 0 && extractPromptContextLength !== undefined && extractPromptContextLength >= 0) {
      parsed.data = extractPromptContextInAssistants(
        parsed.data,
        queries,
        extractPromptContextLength,
        true,
      );
    }
    return parsed;
  } catch (e) {
    return {
      success: false,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Returns all Vapi Assistants whose system prompt contains the input promptQuery
 * @param toolQuery 
 * @returns 
 */
export async function getAssistantBySystemPrompt(
  promptQuery: string,
  matchContextLength?:number
): Promise<ResultOrHumanErr<JsonObject[]>> {
  console.debug(`getAssistantBySystemPrompt: ${promptQuery}`);
  const trimmed = promptQuery.trim();
  if (!trimmed) {
    return { success: false, err: 'Prompt substring is required' };
  }
  try {
    const res = await dextrInternFetch(
      `/api/vapi/assistant-by-system-prompt?prompt=${encodeURIComponent(trimmed)}`,
    );
    if (!res.ok) {
      const text = await res.text();
      return { success: false, err: text || `HTTP ${res.status}` };
    }
    const raw = await res.json();
    const parsed = parseJsonObjectArray(raw);
    if (!parsed.success) return parsed;
    if (matchContextLength !== undefined && matchContextLength > 0) {
      parsed.data = extractPromptContextInAssistants(
        parsed.data,
        [trimmed],
        matchContextLength,
        false,
      );
    }
    return parsed;
  } catch (e) {
    return {
      success: false,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Returns all Vapi Assistants.
 * @returns
 */
export async function listAllAssistants(
  extractPromptQuery?: string,
  extractPromptContextLength?: number,
): Promise<ResultOrHumanErr<JsonObject[]>> {
  console.debug(`listAllAssistants, extractPromptQuery: ${extractPromptQuery ?? '(none)'}`);
  try {
    const res = await dextrInternFetch('/api/vapi/assistants');
    if (!res.ok) {
      const text = await res.text();
      return { success: false, err: text || `HTTP ${res.status}` };
    }
    const raw = await res.json();
    const parsed = parseJsonObjectArray(raw);
    const queries = parseExtractPromptQueries(extractPromptQuery?.trim() ?? '');
    if (parsed.success && queries.length > 0 && extractPromptContextLength !== undefined && extractPromptContextLength >= 0) {
      parsed.data = extractPromptContextInAssistants(
        parsed.data,
        queries,
        extractPromptContextLength,
        true,
      );
    }
    return parsed;
  } catch (e) {
    return {
      success: false,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Returns all Vapi Assistants Prod/Dev pairs that aren't the same
 * @returns 
 */
export async function getAssistantProdDevMismatch(
): Promise<ResultOrHumanErr<JsonObject[]>> {
  console.debug('getAssistantProdDevMismatch');
  try {
    const filter = "";
    const path = filter?.trim()
      ? `/api/vapi/assistant-prod-dev-mismatch?filter=${encodeURIComponent(filter.trim())}`
      : '/api/vapi/assistant-prod-dev-mismatch';
    const res = await dextrInternFetch(path);
    if (!res.ok) {
      const text = await res.text();
      return { success: false, err: text || `HTTP ${res.status}` };
    }
    const raw = await res.json();
    const parsed = parseJsonObjectArray(raw);
    return parsed;
  } catch (e) {
    return {
      success: false,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

function parseExtractPromptQueries(csv: string): string[] {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Optionally filters assistants to those whose systemPrompt contains any of `queries`,
 * then trims each systemPrompt to the matching regions plus `contextLength` chars.
 * @param filterFirst - when true, exclude assistants that don't contain any query
 */
function extractPromptContextInAssistants(
  data: JsonObject[],
  queries: string[],
  contextLength: number,
  filterFirst: boolean,
): JsonObject[] {
  let items = data;
  if (filterFirst) {
    items = items.filter(
      (obj) =>
        typeof obj.systemPrompt === 'string' &&
        queries.some((q) => (obj.systemPrompt as string).includes(q)),
    );
  }
  return items.map((obj) => {
    const systemPrompt = obj.systemPrompt;
    if (typeof systemPrompt !== 'string') return obj;
    return {
      ...obj,
      systemPrompt: findInStringWithContextMulti(systemPrompt, queries, contextLength),
    };
  });
}

function parseJsonObjectArray(raw: unknown): ResultOrHumanErr<JsonObject[]> {
  if (!Array.isArray(raw)) {
    return { success: false, err: 'API response is not an array' };
  }
  const result: JsonObject[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      return { success: false, err: `Item at index ${i} is not a JSON object` };
    }
    const obj = toJsonObject(item as Record<string, unknown>);
    if ('raw' in obj) {
      const { raw: _, ...rest } = obj;
      result.push(rest);
    } else {
      result.push(obj);
    }
  }
  return { success: true, data: result };
}
