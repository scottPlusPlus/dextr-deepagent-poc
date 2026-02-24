import type { Runnable } from '@langchain/core/runnables';

export interface AgentCacheEntry {
  runnable: Runnable;
  lastUsedAt: number;
}

export const agentCache = new Map<string, AgentCacheEntry>();

export function clearAgentCache(): void {
  agentCache.clear();
}
