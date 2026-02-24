import OpenAI from 'openai';
import { shouldUseLlmCache } from '../../agent';
import { agentsDbGetById } from '../agents-db';
import { createPostgresLlmCache } from '../llm-cache-postgres';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const MODEL = 'gpt-5-mini';
const llmCache = createPostgresLlmCache();

export interface PreviousMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmDirectInput {
  userId: string;
  agentId: string;
  message: string;
  previousMessages: PreviousMessage[];
}

export async function llmDirectChat(input: LlmDirectInput): Promise<string> {
  const agent = await agentsDbGetById(input.agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${input.agentId}`);
  }

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: agent.config.systemPrompt },
    ...input.previousMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }) as ChatCompletionMessageParam),
    { role: 'user', content: input.message },
  ];

  const prompt = JSON.stringify(messages);
  if (shouldUseLlmCache()) {
    const cached = await llmCache.lookup(prompt, MODEL);
    if (cached != null && cached.length > 0) {
      return cached[0].text;
    }
  }

  const client = new OpenAI();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages,
  });

  const choice = completion.choices[0];
  const content = choice?.message?.content;
  const result = typeof content === 'string' ? content : '';

  if (shouldUseLlmCache()) {
    await llmCache.update(prompt, MODEL, [{ text: result }]);
  }

  return result;
}
