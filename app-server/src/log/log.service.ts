import { Injectable } from '@nestjs/common';
import { conversationEventsDbLastThreadIds } from '../lib/conversation-events-db';
import { getConversationEvents } from '../lib/get-conversation-events';
import { getConversationHistory } from '../get-conversation-history';
import type {
  ConversationEvent,
  ConversationMessage,
} from '../lib/conversation-events-types';

@Injectable()
export class LogService {
  async getLastThreadIds(limit: number): Promise<string[]> {
    const threadIds = await conversationEventsDbLastThreadIds(limit);
    return threadIds;
  }

  async getEventsByThreadId(threadId: string): Promise<ConversationEvent[]> {
    const events = await getConversationEvents(threadId);
    return events;
  }

  async getHistoryByThreadId(
    threadId: string,
  ): Promise<ConversationMessage[]> {
    const messages = await getConversationHistory(threadId);
    return messages;
  }
}
