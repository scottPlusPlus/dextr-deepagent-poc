import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  getAssistantByNameOrId,
  getAssistantByTool,
  getAssistantBySystemPrompt,
  getAssistantProdDevMismatch,
  listAllAssistants,
} from '../lib/tools/vapi-assistant-tools';

const EXTRACT_PROMPT_QUERY_DESCR =
  'Comma-separated substrings to search for in system prompts (e.g. "checkout, check-out"). Matches if any substring is found. When used with extract_prompt_context_length, filters results and trims each systemPrompt to the matching regions.';

const EXTRACT_PROMPT_CONTEXT_LENGTH_DESCR =
  'Chars of context before/after extract_prompt_query match. Use ~200 for focused excerpts.';

const EXTRACT_PROMPT_DESCRIPTION_SUFFIX =
  'When you need specific info from system prompts (e.g. check-out times), use extract_prompt_query with comma-separated variants like "checkout, check-out" and extract_prompt_context_length to filter and trim. This avoids large responses and extra tool calls. If you dont need the system prompt AT ALL, pass in something like xxxxx which will not match anything';

const extractPromptSchemaFields = {
  extract_prompt_query: z.string().optional().describe(EXTRACT_PROMPT_QUERY_DESCR),
  extract_prompt_context_length: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe(EXTRACT_PROMPT_CONTEXT_LENGTH_DESCR),
};

export const VAPI_TOOL_GET_ASSISTANT_BY_NAME_OR_ID = 'get_assistant_by_name_or_id';
export const VAPI_TOOL_LIST_ALL_ASSISTANTS = 'list_all_assistants';
export const VAPI_TOOL_GET_ASSISTANT_BY_TOOL = 'get_assistant_by_tool';
export const VAPI_TOOL_GET_ASSISTANT_BY_SYSTEM_PROMPT = 'get_assistant_by_system_prompt';
export const VAPI_TOOL_GET_ASSISTANT_PROD_DEV_MISMATCH = 'get_assistant_prod_dev_mismatch';

function formatResult<T>(result: { success: true; data: T } | { success: false; err: string }): string {
  if (result.success) {
    return JSON.stringify(result.data);
  }
  console.error(result.err);
  return JSON.stringify({ error: result.err });
}

export const getAssistantByNameOrIdTool = tool(
  async (args: {
    name_or_id_query: string;
    extract_prompt_query?: string;
    extract_prompt_context_length?: number;
  }) => {
    const result = await getAssistantByNameOrId(
      args.name_or_id_query,
      args.extract_prompt_query,
      args.extract_prompt_context_length,
    );
    return formatResult(result);
  },
  {
    name: VAPI_TOOL_GET_ASSISTANT_BY_NAME_OR_ID,
    description:
      'Returns all Vapi Assistants whose id or name matches the input query. Example: "Henderson" would return assistants "Henderson Prod" and "Henderson Dev". ' +
      EXTRACT_PROMPT_DESCRIPTION_SUFFIX,
    schema: z
      .object({
        name_or_id_query: z.string().describe('Name or ID substring to search for'),
      })
      .extend(extractPromptSchemaFields),
  },
);

export const getAssistantByToolTool = tool(
  async (args: {
    tool_query: string;
    extract_prompt_query?: string;
    extract_prompt_context_length?: number;
  }) => {
    const result = await getAssistantByTool(
      args.tool_query,
      args.extract_prompt_query,
      args.extract_prompt_context_length,
    );
    return formatResult(result);
  },
  {
    name: VAPI_TOOL_GET_ASSISTANT_BY_TOOL,
    description:
      'Returns all Vapi Assistants that have a tool matching the query. Checks tool id, name, and url. ' +
      EXTRACT_PROMPT_DESCRIPTION_SUFFIX,
    schema: z
      .object({
        tool_query: z.string().describe('Tool name, id, or url substring to search for'),
      })
      .extend(extractPromptSchemaFields),
  },
);

export const getAssistantBySystemPromptTool = tool(
  async (args: { prompt_query: string; match_context_length?: number }) => {
    const result = await getAssistantBySystemPrompt(
      args.prompt_query,
      args.match_context_length,
    );
    return formatResult(result);
  },
  {
    name: VAPI_TOOL_GET_ASSISTANT_BY_SYSTEM_PROMPT,
    description:
      'Returns all Vapi Assistants whose system prompt contains the input prompt substring. When match_context_length is provided, each result\'s systemPrompt is trimmed to show only the matching region plus that many characters on either side.',
    schema: z.object({
      prompt_query: z.string().describe('Substring to search for in assistant system prompts'),
      match_context_length: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe(
          'When set, trims each systemPrompt in the results to the matching region plus this many characters before and after. Suggest ex a value around 200 characters (or more if you need more context around the query)',
        ),
    }),
  },
);

export const getAssistantProdDevMismatchTool = tool(
  async () => {
    const result = await getAssistantProdDevMismatch();
    return formatResult(result);
  },
  {
    name: VAPI_TOOL_GET_ASSISTANT_PROD_DEV_MISMATCH,
    description:
      'Returns all Vapi Assistants Prod/Dev pairs that are not identical (have configuration mismatches).',
    schema: z.object({}),
  },
);

export const listAllAssistantsTool = tool(
  async (args?: {
    extract_prompt_query?: string;
    extract_prompt_context_length?: number;
  }) => {
    const result = await listAllAssistants(
      args?.extract_prompt_query,
      args?.extract_prompt_context_length,
    );
    return formatResult(result);
  },
  {
    name: VAPI_TOOL_LIST_ALL_ASSISTANTS,
    description:
      'Returns all Vapi Assistants (name, id, updated time). ' +
      EXTRACT_PROMPT_DESCRIPTION_SUFFIX,
    schema: z.object({}).extend(extractPromptSchemaFields),
  },
);
