/**
 * JSON-serializable message history config for agent config.
 * Used in AgentConfig.messageHistory.
 */
export interface MessageHistoryConfig {
  maxMessages?: number;
  summarizeWhenOver?: { threshold: number; keep: number };
}
