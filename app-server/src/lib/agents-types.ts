import type { MessageHistoryOptions } from '../langx/message-history-middleware';

/**
 * Application-defined agent config shape.
 * Stored as JSONB in DB; this type is used by the server layer.
 * messageHistory may include customTransform for programmatic/test agents;
 * DB-stored config uses only JSON-serializable fields (maxMessages, summarizeWhenOver).
 */
export interface AgentConfig {
  systemPrompt: string;
  toolIds: string[];
  messageHistory?: MessageHistoryOptions;
}

export interface Agent {
  id: string;
  hash: string;
  name: string;
  config: AgentConfig;
}

export interface AgentInsertRow {
  id: string;
  hash: string;
  name: string;
  config: AgentConfig;
}

export interface AgentUpdateRow {
  hash: string;
  name: string;
  config: AgentConfig;
}
