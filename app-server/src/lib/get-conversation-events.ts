import {
  conversationEventsDbByThreadId,
} from './conversation-events-db';
import type { ConversationEvent } from './conversation-events-types';

export async function getConversationEvents(
  threadId: string,
): Promise<ConversationEvent[]> {
  const events = await conversationEventsDbByThreadId(threadId);
  return events;
}
