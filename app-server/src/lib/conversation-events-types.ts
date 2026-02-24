export type ConversationEventType =
  | 'userMessage'
  | 'llmRun'
  | 'toolRun'
  | 'agentMessage';

export interface ConversationEvent {
  id: string;
  thread_id: string;
  user_id: string;
  created_at: string;
  type: ConversationEventType;
  payload: Record<string, unknown>;
  agent_id: string | null;
  agent_hash: string | null;
}

export interface ConversationEventInsertRow {
  thread_id: string;
  user_id: string;
  type: ConversationEventType;
  payload: Record<string, unknown>;
  agent_id?: string | null;
  agent_hash?: string | null;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
