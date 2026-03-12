import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { sotQuery, sotUpdate, sotUpdateApply } from '../lib/tools/sot-tools';

export const SOT_TOOL_QUERY = 'sot_query';
export const SOT_TOOL_UPDATE = 'sot_update';
export const SOT_TOOL_UPDATE_APPLY = 'sot_update_apply';

function formatResult<T>(result: { success: true; data: T } | { success: false; err: string }): string {
  if (result.success) {
    return JSON.stringify(result.data);
  }
  console.error(result.err);
  return JSON.stringify({ error: result.err });
}

export const sotQueryTool = tool(
  async (args: { property_id: string; query: string }) => {
    const result = await sotQuery(args.property_id, args.query);
    return formatResult(result);
  },
  {
    name: SOT_TOOL_QUERY,
    description:
      'Queries the source of truth (SoT) for a property. Uses an LLM to answer the natural language query against the SoT content. Use this to look up property-specific information.',
    schema: z.object({
      property_id: z.string().describe('Property/location id (e.g. "benchmark-inn")'),
      query: z.string().describe('Natural language question to ask about the SOT'),
    }),
  },
);

export const sotUpdateTool = tool(
  async (args: { property_id: string; change_request: string; branch_name?: string }) => {
    const result = await sotUpdate(args.property_id, args.change_request, args.branch_name);
    return formatResult(result);
  },
  {
    name: SOT_TOOL_UPDATE,
    description:
      'Sends a change request to the SoT for a property. Creates a branch artifact with the proposed changes and returns the result (name, hash, link). Does not apply the change; use sot_update_apply after review. When branch_name is provided, applies the change on top of that existing branch instead of creating a new one.',
    schema: z.object({
      property_id: z.string().describe('Property/location id (e.g. "benchmark-inn")'),
      change_request: z.string().describe('Description of the change to apply'),
      branch_name: z
        .string()
        .optional()
        .describe(
          'Optional. When provided, applies the change on top of this existing branch instead of creating a new one.',
        ),
    }),
  },
);

export const sotUpdateApplyTool = tool(
  async (args: { property_id: string; branch_name: string }) => {
    const result = await sotUpdateApply(args.property_id, args.branch_name);
    return formatResult(result);
  },
  {
    name: SOT_TOOL_UPDATE_APPLY,
    description:
      'Applies a branch artifact to the root SoT. The branch artifact is identified by its name (returned from sot_update, should include "_b_").  Returns a link to the updated Source of Truth',
    schema: z.object({
      property_id: z.string().describe('Property/location id (e.g. "benchmark-inn")'),
      branch_name: z.string().describe('Branch artifact name (must contain "_b_")'),
    }),
  },
);
