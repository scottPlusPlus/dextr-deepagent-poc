/**
 * JSON-serializable message history config for agent config.
 * Used in AgentConfig.messageHistory. Only include defined fields when storing.
 *
 * All values are message counts (not tokens).
 */
export interface MessageHistoryConfig {
  /** Keep only the last N messages; omit for no trimming (full history). */
  maxMessages?: number;
  /** When history exceeds threshold messages, summarize older ones and keep last `keep`. */
  summarizeWhenOver?: { threshold: number; keep: number };
}

/**
 * Default: summarize when over 24 messages, keep last 8.
 */
export const DEFAULT_MESSAGE_HISTORY_CONFIG: MessageHistoryConfig = {
  summarizeWhenOver: { threshold: 24, keep: 8 },
};

export function parseMessageHistoryConfig(
  raw: unknown,
): MessageHistoryConfig | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const result: MessageHistoryConfig = {};
  const maxMessages = obj.maxMessages;
  if (typeof maxMessages === 'number' && maxMessages > 0) {
    result.maxMessages = maxMessages;
  }
  const swo = obj.summarizeWhenOver;
  if (
    swo != null &&
    typeof swo === 'object' &&
    typeof (swo as { threshold?: unknown }).threshold === 'number' &&
    typeof (swo as { keep?: unknown }).keep === 'number'
  ) {
    const { threshold, keep } = swo as { threshold: number; keep: number };
    if (threshold > 0 && keep > 0) {
      result.summarizeWhenOver = { threshold, keep };
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
