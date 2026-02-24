import type { ConversationEventType } from './conversation-events-types';
import { conversationEventsDbInsert } from './conversation-events-db';
import { JsonObject } from './utils-agnostic/json-utils';
import { ENV_IS_PROD } from './system-utils';
import { truncateString } from './utils-agnostic/string-utils';

export interface LogConversationEventInput {
  threadId: string;
  userId: string;
  type: ConversationEventType;
  payload: JsonObject;
  agentId?: string;
  agentHash?: string;
}

export function logConversationEvent(
  input: LogConversationEventInput,
): Promise<void> {
  // if (!ENV_IS_PROD && (input.type === 'userMessage' || input.type === 'agentMessage')) {
  //   const msg = input.payload.message;
  //   const msgStr = typeof msg === 'string' ? msg : '';
  //   console.log(`convo event ${input.threadId} ${input.type}: ${truncateString(msgStr, 32)}`);
  // }
  const row = {
    thread_id: input.threadId,
    user_id: input.userId,
    agent_id: input.agentId ?? null,
    agent_hash: input.agentHash ?? null,
    type: input.type,
    payload: input.payload,
  };
  conversationEventsDbInsert(row)
    .catch((err) => {
      console.error('Failed to log conversation event:', err);
      return new Promise<void>((resolve) => setTimeout(resolve, 10_000)).then(
        () => conversationEventsDbInsert(row),
      );
    })
    .catch((retryErr) => {
      console.error('Failed to log conversation event (retry):', retryErr);
    });
  return Promise.resolve();
}
