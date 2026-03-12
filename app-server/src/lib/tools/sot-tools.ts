import { dextrInternPost } from '../dextr-intern-utils';
import { toJsonObject, type JsonObject } from '../utils-agnostic/json-utils';

export type ResultOrHumanErr<T> =
  | { success: true; data: T }
  | { success: false; err: string };

/**
 * Queries the source of truth for a property. Uses an LLM to answer the query
 * against the SOT content.
 * @param property_id - Property/location slug (e.g. "benchmark-inn")
 * @param query - Natural language question to ask about the SOT
 */
export async function sotQuery(
  property_id: string,
  query: string,
): Promise<ResultOrHumanErr<string>> {
  console.debug(`sotQuery: propertyId=${property_id}, query=${query}`);
  const trimmedPropertyId = property_id.trim();
  const trimmedQuery = query.trim();
  if (!trimmedPropertyId) {
    return { success: false, err: 'propertyId is required' };
  }
  if (!trimmedQuery) {
    return { success: false, err: 'query is required' };
  }
  try {
    const res = await dextrInternPost('/api/cos/sot_query', {
      propertyId: trimmedPropertyId,
      query: trimmedQuery,
    });
    if (!res.ok) {
      const text = await res.text();
      return { success: false, err: text || `HTTP ${res.status}` };
    }
    const raw = await res.json();
    const data = typeof raw === 'string' ? raw : String(raw ?? '');
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Sends a change request to the SOT for a property. Creates a branch artifact
 * with the proposed changes and returns the result (name, hash, link).
 * When branch_name is provided, applies the change on top of that existing branch.
 * @param property_id - Property/location slug (e.g. "benchmark-inn")
 * @param changeRequest - Description of the change to apply
 * @param branch_name - Optional. When provided, applies the change on top of this existing branch instead of creating a new one.
 */
export async function sotUpdate(
  property_id: string,
  changeRequest: string,
  branch_name?: string,
): Promise<ResultOrHumanErr<JsonObject>> {
  console.debug(`sotUpdate: propertyId=${property_id}`);
  const trimmedPropertyId = property_id.trim();
  const trimmedChange = changeRequest.trim();
  if (!trimmedPropertyId) {
    return { success: false, err: 'propertyId is required' };
  }
  if (!trimmedChange) {
    return { success: false, err: 'changeRequest is required' };
  }
  const body: Record<string, string> = {
    propertyId: trimmedPropertyId,
    changeRequest: trimmedChange,
  };
  if (branch_name?.trim()) {
    body.branchName = branch_name.trim();
  }
  try {
    const res = await dextrInternPost('/api/cos/sot_update', body);
    if (!res.ok) {
      const text = await res.text();
      return { success: false, err: text || `HTTP ${res.status}` };
    }
    const raw = await res.json();
    const data = toJsonObject(
      raw !== null && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {},
    );
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Applies a branch artifact to the root SOT. The branch artifact is identified
 * by its name (returned from sotUpdate).
 * @param property_id - Property/location slug (e.g. "benchmark-inn")
 * @param branchName - Branch artifact name (must contain "_b_")
 */
export async function sotUpdateApply(
  property_id: string,
  branchName: string,
): Promise<ResultOrHumanErr<string>> {
  console.debug(`sotUpdateApply: propertyId=${property_id}, branchName=${branchName}`);
  const trimmedPropertyId = property_id.trim();
  const trimmedBranch = branchName.trim();
  if (!trimmedPropertyId) {
    return { success: false, err: 'propertyId is required' };
  }
  if (!trimmedBranch) {
    return { success: false, err: 'branchName is required' };
  }
  try {
    const res = await dextrInternPost('/api/cos/sot_update_apply', {
      propertyId: trimmedPropertyId,
      branchName: trimmedBranch,
    });
    if (!res.ok) {
      const text = await res.text();
      return { success: false, err: text || `HTTP ${res.status}` };
    }
    const text = await res.text();
    return { success: true, data:text };
  } catch (e) {
    return {
      success: false,
      err: e instanceof Error ? e.message : String(e),
    };
  }
}
