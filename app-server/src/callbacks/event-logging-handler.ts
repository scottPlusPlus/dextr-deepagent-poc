import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { LLMResult } from '@langchain/core/outputs';
import type { BaseMessage } from '@langchain/core/messages';
import { logConversationEvent } from '../lib/conversation-events';
import {
  toJsonValue,
  type JsonObject,
  type JsonValue,
} from '../lib/utils-agnostic/json-utils';

interface LlmMetadata {
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  model: string | null;
  totalTimeMs: number | null;
}

function extractLlmMetadata(
  output: LLMResult,
  totalTimeMs: number | null,
): LlmMetadata {
  const llmOutput = output.llmOutput ?? {};
  const usage = llmOutput.usage_metadata ?? llmOutput.tokenUsage ?? {};
  const respMeta = llmOutput.response_metadata as {
    usage?: Record<string, unknown>;
  } | undefined;
  const respUsage = respMeta?.usage ?? {};

  const genMsg = output.generations?.[0]?.[0] as {
    message?: { response_metadata?: Record<string, unknown> };
  } | undefined;
  const genRespUsage = (genMsg?.message?.response_metadata as {
    usage?: Record<string, unknown>;
  } | undefined)?.usage ?? {};

  const combinedUsage = { ...respUsage, ...genRespUsage };

  const inputTokens =
    (usage.input_tokens as number | undefined) ??
    (usage.inputTokens as number | undefined) ??
    (combinedUsage.prompt_tokens as number | undefined) ??
    null;

  const outputTokens =
    (usage.output_tokens as number | undefined) ??
    (usage.outputTokens as number | undefined) ??
    (combinedUsage.completion_tokens as number | undefined) ??
    null;

  const outDetails =
    (usage.output_token_details as Record<string, unknown> | undefined) ??
    (combinedUsage.completion_tokens_details as Record<string, unknown> | undefined) ??
    {};
  const reasoningTokens =
    (outDetails.reasoning as number | undefined) ??
    (outDetails.reasoning_tokens as number | undefined) ??
    null;

  const model =
    (llmOutput.model as string | undefined) ??
    (llmOutput.model_name as string | undefined) ??
    null;

  const result: LlmMetadata = {
    inputTokens: typeof inputTokens === 'number' ? inputTokens : null,
    outputTokens: typeof outputTokens === 'number' ? outputTokens : null,
    reasoningTokens: typeof reasoningTokens === 'number' ? reasoningTokens : null,
    model: typeof model === 'string' ? model : null,
    totalTimeMs,
  };
  return result;
}

interface PendingToolRun {
  tool: string;
  inputs: Record<string, unknown>;
}

export class EventLoggingHandler extends BaseCallbackHandler {
  readonly name = 'EventLoggingHandler';

  private readonly threadId: string;
  private readonly userId: string;
  private readonly pendingToolRuns: Map<string, PendingToolRun> = new Map();
  private readonly pendingLlmInputs: Map<string, JsonValue> = new Map();
  private readonly pendingLlmStartMs: Map<string, number> = new Map();

  private readonly agentId: string | null;
  private readonly agentHash: string | null;

  constructor(
    threadId: string,
    userId: string,
    agentId?: string,
    agentHash?: string,
  ) {
    super();
    this.threadId = threadId;
    this.userId = userId;
    this.agentId = agentId ?? null;
    this.agentHash = agentHash ?? null;
  }

  async logUserMessage(message: string): Promise<void> {
    await logConversationEvent({
      threadId: this.threadId,
      userId: this.userId,
      type: 'userMessage',
      payload: { message },
      agentId: this.agentId ?? undefined,
      agentHash: this.agentHash ?? undefined,
    });
  }

  async logAgentMessage(message: string): Promise<void> {
    await logConversationEvent({
      threadId: this.threadId,
      userId: this.userId,
      type: 'agentMessage',
      payload: { message },
      agentId: this.agentId ?? undefined,
      agentHash: this.agentHash ?? undefined,
    });
  }

  async handleChatModelStart(
    _llm: unknown,
    messages: BaseMessage[][],
    runId: string,
  ): Promise<void> {
    this.pendingLlmStartMs.set(runId, Date.now());
    const inputs = messages.map((msgs) =>
      msgs.map((m) => ({
        type: m.type,
        content: toJsonValue(m.content),
      })),
    );
    this.pendingLlmInputs.set(runId, inputs);
  }

  async handleLLMEnd(
    output: LLMResult,
    runId: string,
  ): Promise<void> {
    const inputs = this.pendingLlmInputs.get(runId);
    this.pendingLlmInputs.delete(runId);

    const startMs = this.pendingLlmStartMs.get(runId);
    this.pendingLlmStartMs.delete(runId);
    const totalTimeMs =
      startMs != null ? Date.now() - startMs : null;

    const outputs = output.generations?.map((genList) =>
      genList.map((g) => ({
        text: g.text,
        message: (g as { message?: unknown }).message,
      })),
    );

    const metadata = extractLlmMetadata(output, totalTimeMs);

    const payload = toJsonValue({
      runId,
      inputs: inputs ?? {},
      outputs: outputs ?? {},
      metadata,
    }) as JsonObject;

    await logConversationEvent({
      threadId: this.threadId,
      userId: this.userId,
      type: 'llmRun',
      payload,
      agentId: this.agentId ?? undefined,
      agentHash: this.agentHash ?? undefined,
    });
  }

  async handleToolStart(
    tool: { name?: string },
    input: string,
    runId: string,
  ): Promise<void> {
    let inputs: Record<string, unknown> = {};
    try {
      inputs = typeof input === 'string' ? JSON.parse(input) : { raw: input };
    } catch {
      inputs = { raw: input };
    }
    const toolName = tool?.name ?? 'unknown';
    this.pendingToolRuns.set(runId, { tool: toolName, inputs });
  }

  async handleToolEnd(
    output: unknown,
    runId: string,
  ): Promise<void> {
    const pending = this.pendingToolRuns.get(runId);
    this.pendingToolRuns.delete(runId);

    const tool = pending?.tool ?? 'unknown';
    const inputs = pending?.inputs ?? {};
    const outputs = typeof output === 'object' && output !== null
      ? (output as Record<string, unknown>)
      : { result: output };

    const payload = toJsonValue({
      runId,
      tool,
      inputs,
      outputs,
      metadata: {},
    }) as JsonObject;

    await logConversationEvent({
      threadId: this.threadId,
      userId: this.userId,
      type: 'toolRun',
      payload,
      agentId: this.agentId ?? undefined,
      agentHash: this.agentHash ?? undefined,
    });
  }
}
