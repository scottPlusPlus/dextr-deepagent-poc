import { getKnex } from './knex-instance-db';
import type {
  ConversationEvent,
  ConversationEventInsertRow,
  ConversationEventType,
} from './conversation-events-types';

export async function conversationEventsDbInsert(
  row: ConversationEventInsertRow,
): Promise<{ id: string }> {
  const knex = getKnex();
  const insertPayload = {
    thread_id: row.thread_id,
    user_id: row.user_id,
    type: row.type,
    agent_id: row.agent_id ?? null,
    agent_hash: row.agent_hash ?? null,
    payload: row.payload,
  };
  const result = await knex('conversation_events')
    .insert(insertPayload)
    .returning('id');
  const id = result[0]?.id as string;
  const out = { id };
  return out;
}

export async function conversationEventsDbByThreadId(
  threadId: string,
): Promise<ConversationEvent[]> {
  const knex = getKnex();
  const rows = await knex('conversation_events')
    .where('thread_id', threadId)
    .orderBy('created_at', 'asc');
  const result: ConversationEvent[] = rows.map((r) => ({
    id: r.id,
    thread_id: r.thread_id,
    user_id: r.user_id,
    created_at: r.created_at,
    type: r.type as ConversationEventType,
    payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
    agent_id: r.agent_id,
    agent_hash: r.agent_hash,
  }));
  return result;
}

export async function conversationEventsDbLastThreadIds(
  limit: number,
): Promise<string[]> {
  const knex = getKnex();
  const rows = await knex('conversation_events')
    .select('thread_id')
    .max('created_at as max_created_at')
    .groupBy('thread_id')
    .orderBy('max_created_at', 'desc')
    .limit(limit);
  const result: string[] = rows.map((r) => r.thread_id as string);
  return result;
}

export async function conversationEventsDbThreadIdsSince(
  since: Date,
): Promise<string[]> {
  const knex = getKnex();
  const rows = await knex('conversation_events')
    .select('thread_id')
    .where('created_at', '>=', since)
    .distinct();
  return rows.map((r) => r.thread_id as string);
}
