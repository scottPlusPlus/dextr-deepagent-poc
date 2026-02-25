import {
  conversationEventsDbByThreadId,
  conversationEventsDbThreadIdsSince,
} from './conversation-events-db';
import type { ConversationEvent } from './conversation-events-types';
import { withTtlCache } from './utils-agnostic/ttl-cache';

interface LlmMetadata {
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
}

const CACHE_TTL_MS = 60_000;

export type ThreadWithTokens = {
    name:string,
    id: string,
    tokens:number,
}

function sumTokensFromMetadata(metadata: unknown): number {
  if (metadata == null || typeof metadata !== 'object') return 0;
  const m = metadata as LlmMetadata;
  const input = typeof m.inputTokens === 'number' ? m.inputTokens : 0;
  const output = typeof m.outputTokens === 'number' ? m.outputTokens : 0;
  const reasoning = typeof m.reasoningTokens === 'number' ? m.reasoningTokens : 0;
  return input + output + reasoning;
}

function tokensFromEvent(event: ConversationEvent, since: Date): number {
  if (event.type !== 'llmRun') return 0;
  const eventDate = new Date(event.created_at);
  if (eventDate < since) return 0;
  const metadata = event.payload?.metadata;
  return sumTokensFromMetadata(metadata);
}

export async function recentTokenUsage(hours: number): Promise<ThreadWithTokens[]> {
  const cacheKey = `recentTokenUsage:${hours}`;
  return withTtlCache(cacheKey, CACHE_TTL_MS, async () => {
    const now = Date.now();
    const since = new Date(now - hours * 60 * 60 * 1000);
    const threadIds = await conversationEventsDbThreadIdsSince(since);

    const result: ThreadWithTokens[] = [];
    for (const threadId of threadIds) {
      const events = await conversationEventsDbByThreadId(threadId);
      let tokens = 0;
      for (const event of events) {
        tokens += tokensFromEvent(event, since);
      }
      result.push({ name: threadId, id: threadId, tokens });
    }
    return result;
  });
}

export async function tokensInLastHour(): Promise<number> {
  const threads = await recentTokenUsage(1);
  return threads.reduce((sum, t) => sum + t.tokens, 0);
}
