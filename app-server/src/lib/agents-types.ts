import type { MessageHistoryOptions } from '../langx/message-history-middleware';
import type { MessageHistoryConfig } from './message-history-types';

/**
 * Application-defined agent config shape.
 * Stored as JSONB in DB; JSON-serializable only (maxMessages, summarizeWhenOver).
 * Runtime-only options (e.g. customTransform) live in AgentConfigRuntime.
 */
export interface AgentConfig {
  systemPrompt: string;
  toolIds: string[];
  messageHistory: MessageHistoryConfig;
}

export type AgentConfigRuntime = AgentConfig & {
  messageHistory: MessageHistoryOptions;
};

export interface Agent {
  id: string;
  hash: string;
  name: string;
  config: AgentConfig;
}

export interface AgentRuntime extends Omit<Agent, 'config'> {
  config: AgentConfigRuntime;
}

export type AgentOrRuntime = Agent | AgentRuntime;

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
