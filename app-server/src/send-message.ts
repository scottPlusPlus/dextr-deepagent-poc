import * as crypto from 'crypto';
import { resolveLangxAgent } from './agent';
import { EventLoggingHandler } from './callbacks/event-logging-handler';
import { agentsDbGetById } from './lib/agents-db';
import { tokensInLastHour } from './lib/recent-token-usage';

const TOKEN_LIMIT_THRESHOLD = 850_000; //approx $10 of GPT 4.1 tokens
const TOKEN_LIMIT_MESSAGE =
  'Token usage in the last hour has exceeded the limit. Please try again later.';

export interface SendMessageInput {
  userId: string;
  threadId?: string;
  message: string;
  agentId?: string;
}

export type StreamChunk = { chunk?: string; threadId?: string };

export interface SendMessageOutput {
  response: string;
  threadId?: string;
}

function generateThreadId(userId: string, agentId: string | undefined): string {
  const u = (userId ?? 'anon').slice(0, 3).padEnd(3, 'x');
  const a = (agentId ?? 'def').slice(0, 3).padEnd(3, 'x');
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mon = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ][now.getMonth()];
  const day = String(now.getDate()).padStart(2, '0');
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return `${u}-${a}-${yy}${mon}${day}-${suffix}`;
}

export async function* streamMessage(
  input: SendMessageInput,
): AsyncGenerator<StreamChunk> {
  const effectiveThreadId =
    input.threadId?.trim() || generateThreadId(input.userId, input.agentId);
  const agentMeta =
    input.agentId != null
      ? await agentsDbGetById(input.agentId)
      : null;
  const agentId = agentMeta?.id ?? undefined;
  const agentHash = agentMeta?.hash ?? undefined;

  const eventHandler = new EventLoggingHandler(
    effectiveThreadId,
    input.userId,
    agentId,
    agentHash,
  );
  await eventHandler.logUserMessage(input.message);

  const tokensUsed = await tokensInLastHour();
  if (tokensUsed >= TOKEN_LIMIT_THRESHOLD) {
    if (!input.threadId?.trim()) {
      yield { threadId: effectiveThreadId };
    }
    yield { chunk: TOKEN_LIMIT_MESSAGE };
    await eventHandler.logAgentMessage(TOKEN_LIMIT_MESSAGE);
    return;
  }

  const langxAgent = await resolveLangxAgent(input.agentId);
  const streamOptions = {
    configurable: { thread_id: effectiveThreadId },
    streamMode: 'messages' as const,
    callbacks: [eventHandler],
  };
  const stream = await langxAgent.stream(
    {
      messages: [{ role: 'user' as const, content: input.message }],
    },
    streamOptions as Parameters<typeof langxAgent.stream>[1],
  );

  if (!input.threadId?.trim()) {
    yield { threadId: effectiveThreadId };
  }

  let fullResponse = '';
  for await (const chunk of stream) {
    const text = extractContentFromMessageChunk(chunk);
    if (text) {
      fullResponse += text;
      yield { chunk: text };
    }
  }

  await eventHandler.logAgentMessage(fullResponse);
}

export async function sendMessage(
  input: SendMessageInput,
): Promise<SendMessageOutput> {
  let response = '';
  let assignedThreadId: string | undefined;
  for await (const item of streamMessage(input)) {
    if (item.chunk) response += item.chunk;
    if (item.threadId) assignedThreadId = item.threadId;
  }
  const output: SendMessageOutput = { response };
  if (assignedThreadId) output.threadId = assignedThreadId;
  return output;
}

function extractContentFromMessageChunk(chunk: unknown): string {
  if (chunk == null) return '';
  if (typeof chunk === 'string') return chunk;
  if (Array.isArray(chunk)) {
    const [message] = chunk as [unknown, unknown];
    return extractContentFromMessage(message);
  }
  return extractContentFromMessage(chunk);
}

function extractContentFromMessage(message: unknown): string {
  if (message == null || typeof message !== 'object') return '';
  const obj = message as { content?: string | unknown[]; type?: string };
  // Only stream AI/assistant text; skip tool results and other non-user-facing messages
  const msgType = obj.type;
  if (msgType === 'tool') return '';
  if (msgType != null && msgType !== 'ai' && msgType !== 'assistant') return '';
  const raw = obj.content;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return (raw as { text?: string }[])
      .map((c) => c?.text ?? '')
      .join('');
  }
  return '';
}
