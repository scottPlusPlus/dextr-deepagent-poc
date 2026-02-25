import type { StructuredTool } from '@langchain/core/tools';
import { getCurrentTimeTool } from '../tools/get-current-time';
import { recentTokenUsageTool } from '../tools/recent-token-usage';
import { wordOfTheDayTool } from '../tools/word-of-the-day';
import { createQueryHotelAvailabilityTool } from '../tools/query-hotel-availability';
import {
  VAPI_TOOL_GET_ASSISTANT_BY_NAME_OR_ID,
  VAPI_TOOL_GET_ASSISTANT_BY_TOOL,
  VAPI_TOOL_GET_ASSISTANT_BY_SYSTEM_PROMPT,
  VAPI_TOOL_GET_ASSISTANT_PROD_DEV_MISMATCH,
  VAPI_TOOL_LIST_ALL_ASSISTANTS,
  getAssistantByNameOrIdTool,
  getAssistantByToolTool,
  getAssistantBySystemPromptTool,
  getAssistantProdDevMismatchTool,
  listAllAssistantsTool,
} from '../tools/vapi-tools-langx';

type ToolEntry = StructuredTool | ((agentId: string) => StructuredTool);

/**
 * Hard-coded map from toolId to tool instance or factory.
 * Factories receive agentId when the agent is built.
 */
const TOOL_REGISTRY: Record<string, ToolEntry> = {
  get_current_time: getCurrentTimeTool,
  recent_token_usage: recentTokenUsageTool,
  word_of_the_day: wordOfTheDayTool,
  query_hotel_availability: createQueryHotelAvailabilityTool,
  [VAPI_TOOL_GET_ASSISTANT_BY_NAME_OR_ID]: getAssistantByNameOrIdTool,
  [VAPI_TOOL_GET_ASSISTANT_BY_TOOL]: getAssistantByToolTool,
  [VAPI_TOOL_GET_ASSISTANT_BY_SYSTEM_PROMPT]: getAssistantBySystemPromptTool,
  [VAPI_TOOL_GET_ASSISTANT_PROD_DEV_MISMATCH]: getAssistantProdDevMismatchTool,
  [VAPI_TOOL_LIST_ALL_ASSISTANTS]: listAllAssistantsTool,
};

export interface ToolMetadata {
  id: string;
  description: string;
}

export function listToolsMetadata(): ToolMetadata[] {
  const result: ToolMetadata[] = [];
  for (const [id, entry] of Object.entries(TOOL_REGISTRY)) {
    const t =
      typeof entry === 'function' ? entry('') : entry;
    result.push({
      id: t.name,
      description: t.description,
    });
  }
  return result;
}

export function getToolsByIds(
  toolIds: string[],
  agentId?: string,
): StructuredTool[] {
  const result: StructuredTool[] = [];
  for (const id of toolIds) {
    const entry = TOOL_REGISTRY[id];
    if (!entry) continue;
    const t =
      typeof entry === 'function'
        ? entry(agentId ?? '')
        : entry;
    result.push(t);
  }
  return result;
}
