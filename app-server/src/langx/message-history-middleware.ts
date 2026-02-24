import type { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createMiddleware } from 'langchain';
import type { MessageHistoryConfig } from '../lib/message-history-types';

const SUMMARY_SYSTEM_PROMPT =
  'Summarize the following conversation concisely. Preserve key facts, decisions, and context. Output only the summary, no preamble.';

export interface MessageHistoryOptions extends MessageHistoryConfig {
  customTransform?: (
    messages: BaseMessage[],
  ) => BaseMessage[] | Promise<BaseMessage[]>;
}

function applyMaxMessages(
  messages: BaseMessage[],
  maxMessages: number,
): BaseMessage[] {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(-maxMessages);
}

function extractContentFromModelOutput(output: unknown): string {
  if (output == null) return '';
  if (typeof output === 'string') return output;
  if (typeof output === 'object' && 'content' in output) {
    const content = (output as { content: unknown }).content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return (content as { text?: string }[])
        .map((c) => c?.text ?? '')
        .join('');
    }
  }
  return String(output);
}

async function applySummarizeWhenOver(
  messages: BaseMessage[],
  opts: { threshold: number; keep: number },
  model: { invoke: (input: BaseMessage[]) => Promise<unknown> },
): Promise<BaseMessage[]> {
  if (messages.length <= opts.threshold) return messages;
  const toSummarize = messages.slice(0, -opts.keep);
  const recent = messages.slice(-opts.keep);
  const summaryMessages: BaseMessage[] = [
    new SystemMessage(SUMMARY_SYSTEM_PROMPT),
    ...toSummarize,
  ];
  const response = await model.invoke(summaryMessages);
  const summaryText = extractContentFromModelOutput(response);
  const summaryMessage = new HumanMessage(
    `[Previous conversation summary]: ${summaryText}`,
  );
  return [summaryMessage, ...recent];
}

async function applyMessageHistoryPolicy(
  messages: BaseMessage[],
  opts: MessageHistoryOptions,
  model: { invoke: (input: BaseMessage[]) => Promise<unknown> },
): Promise<BaseMessage[]> {
  if (opts.customTransform != null) {
    return opts.customTransform(messages);
  }
  if (opts.maxMessages != null && opts.maxMessages > 0) {
    return applyMaxMessages(messages, opts.maxMessages);
  }
  if (opts.summarizeWhenOver != null) {
    return applySummarizeWhenOver(
      messages,
      opts.summarizeWhenOver,
      model,
    );
  }
  return messages;
}

export function createMessageHistoryMiddleware(
  opts: MessageHistoryOptions,
): ReturnType<typeof createMiddleware> {
  return createMiddleware({
    name: 'MessageHistoryMiddleware',
    wrapModelCall: async (request, handler) => {
      const transformed = await applyMessageHistoryPolicy(
        request.messages,
        opts,
        request.model,
      );
      const modifiedRequest = { ...request, messages: transformed };
      return handler(modifiedRequest);
    },
  });
}
