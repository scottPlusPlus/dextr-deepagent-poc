import type { Runnable } from '@langchain/core/runnables';
import { ChatOpenAI, OpenAIChatModelId } from '@langchain/openai';
import { createDeepAgent } from 'deepagents';
import { createCheckpointer } from './langx/checkpointer-instance';
import { createMessageHistoryMiddleware } from './langx/message-history-middleware';
import { getToolsByIds } from './lib/tool-registry';
import { agentsDbGetById } from './lib/agents-db';
import type { AgentConfig } from './lib/agents-types';
import { createPostgresLlmCache } from './lib/llm-cache-postgres';
import { ENV_IS_PROD } from './lib/system-utils';
import { BaseCache } from '@langchain/core/caches';
import { agentCache, clearAgentCache } from './lib/agent-cache';

export { clearAgentCache };

const targetModel: OpenAIChatModelId = 'gpt-5-mini';
const STALE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const DEFAULT_AGENT_CONFIG: AgentConfig = {
  systemPrompt: '',
  toolIds: ['get_current_time', 'word_of_the_day'],
};
const refreshInProgress = new Set<string>();

function cacheKeyForAgentId(agentId: string | undefined): string {
  return agentId ?? '__default__';
}

export async function resolveLangxAgent(
  agentId?: string,
): Promise<Runnable> {
  const key = cacheKeyForAgentId(agentId);
  const now = Date.now();
  const entry = agentCache.get(key);

  if (entry != null) {
    const wasStale = now - entry.lastUsedAt > STALE_TTL_MS;
    entry.lastUsedAt = now;
    if (wasStale) {
      scheduleBackgroundRefresh(key, agentId);
    }
    return entry.runnable;
  }

  const runnable = await buildLangxAgent(agentId);
  agentCache.set(key, { runnable, lastUsedAt: now });
  return runnable;
}

function scheduleBackgroundRefresh(
  key: string,
  agentId: string | undefined,
): void {
  if (refreshInProgress.has(key)) return;
  refreshInProgress.add(key);

  void (async () => {
    try {
      const runnable = await buildLangxAgent(agentId);
      const now = Date.now();
      agentCache.set(key, { runnable, lastUsedAt: now });
    } finally {
      refreshInProgress.delete(key);
    }
  })();
}

async function buildLangxAgent(agentId?: string): Promise<Runnable> {
  console.log(`build agent: ${agentId}`);
  const agentConfig = await resolveAgentConfig(agentId);
  const checkpointer = createCheckpointer();
  const tools = getToolsByIds(agentConfig.toolIds, agentId);
  const messageHistoryOpts = agentConfig.messageHistory;
  const middleware = messageHistoryOpts
    ? [createMessageHistoryMiddleware(messageHistoryOpts)]
    : undefined;
  const runnable = createDeepAgent({
    model: new ChatOpenAI({
      model: targetModel,
      temperature: 1,
      cache: getOurLlmCache(),
    }),
    systemPrompt: agentConfig.systemPrompt,
    tools,
    middleware,
    // @ts-expect-error PostgresSaver works at runtime; type mismatch between @langchain/langgraph-checkpoint-postgres and langchain's nested @langchain/langgraph-checkpoint (serde/deleteThread)
    checkpointer,
  }) as unknown as Runnable;
  return runnable;
}

let _llmCacheOverrideForTesting: boolean | null = null;

export function shouldUseLlmCache(): boolean {
  if (_llmCacheOverrideForTesting !== null) {
    return _llmCacheOverrideForTesting;
  }
  return !ENV_IS_PROD;
}

export const __for_testing = {
  setShouldUseLlmCache(value: boolean | null): void {
    _llmCacheOverrideForTesting = value;
  },
  clearAgentCache,
};

function getOurLlmCache(): BaseCache | undefined {
  return shouldUseLlmCache() ? createPostgresLlmCache() : undefined;
}

async function resolveAgentConfig(agentId?: string): Promise<AgentConfig> {
  if (!agentId) return DEFAULT_AGENT_CONFIG;
  const agent = await agentsDbGetById(agentId);
  if (!agent) return DEFAULT_AGENT_CONFIG;
  return agent.config;
}
