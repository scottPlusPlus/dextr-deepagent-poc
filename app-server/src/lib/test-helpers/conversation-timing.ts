import { getConversationEvents } from '../get-conversation-events';

export interface TimingStats {
  totalMs: number;
  llmRunMs: number;
  nonLlmMs: number;
}

export async function computeTimingStats(
  threadId: string,
  startMs: number,
): Promise<TimingStats> {
  const events = await getConversationEvents(threadId);
  let llmRunMs = 0;
  for (const e of events) {
    if (e.type === 'llmRun') {
      const meta = (e.payload as { metadata?: { totalTimeMs?: number } })
        .metadata;
      const ms = meta?.totalTimeMs;
      if (typeof ms === 'number') llmRunMs += ms;
    }
  }
  const totalMs = Date.now() - startMs;
  const nonLlmMs = Math.max(0, totalMs - llmRunMs);
  const result: TimingStats = { totalMs, llmRunMs, nonLlmMs };
  return result;
}

export function logTimingStats(testName: string, stats: TimingStats): void {
  console.log(
    `[timing] ${testName}: total=${stats.totalMs}ms, llmRun=${stats.llmRunMs}ms, nonLlm=${stats.nonLlmMs}ms`,
  );
}
