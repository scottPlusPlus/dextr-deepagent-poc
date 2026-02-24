import type { BaseMessage } from '@langchain/core/messages';
import { resolveLangxAgent } from './agent';
import type { ConversationMessage } from './lib/conversation-events-types';

interface GraphWithGetState {
  getState(
    config: { configurable: { thread_id: string } },
  ): Promise<{ values: { messages?: BaseMessage[] } }>;
}

export async function getConversationHistory(
  threadId: string,
): Promise<ConversationMessage[]> {
  try {
    const agent = await resolveLangxAgent();
    const graph = agent as unknown as GraphWithGetState;

    if (typeof graph.getState !== 'function') {
      return [];
    }

    const state = await graph.getState({
      configurable: { thread_id: threadId },
    });

    const messages = state.values?.messages;
    if (!Array.isArray(messages)) {
      return [];
    }

    const result: ConversationMessage[] = [];
    for (const msg of messages) {
      const role = mapRole(msg);
      const content = extractMessageContent(msg);
      if (role && content !== undefined) {
        result.push({ role, content });
      }
    }
    return result;
  } catch {
    return [];
  }
}

function mapRole(msg: BaseMessage): 'user' | 'assistant' | 'system' | null {
  const type = msg.type;
  if (type === 'human' || type === 'user') return 'user';
  if (type === 'ai' || type === 'assistant') return 'assistant';
  if (type === 'system') return 'system';
  return null;
}

function extractMessageContent(msg: BaseMessage): string | undefined {
  const content = msg.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return (content as { text?: string }[])
      .map((c) => c?.text ?? '')
      .join('');
  }
  return undefined;
}
