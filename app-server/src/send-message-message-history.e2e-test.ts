import 'dotenv/config';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { setupCheckpointer, teardownCheckpointer } from './langx/checkpointer-instance';
import { destroyKnex } from './lib/knex-instance-db';
import {
  getAgentsDbMockFactory,
  setupMockedAgentsDb,
} from './lib/test-helpers/agent-mocking';
import {
  computeTimingStats,
  logTimingStats,
} from './lib/test-helpers/conversation-timing';
import { sendMessage } from './send-message';
import type { Agent } from './lib/agents-types';

jest.mock('./lib/agents-db', () => getAgentsDbMockFactory()());
const agentsMock = setupMockedAgentsDb();

const MAX_MESSAGES_AGENT_ID = 'max-6-msgs';
const SUMMARIZER_AGENT_ID = 'summarizer';
const REPLACE_AGENT_ID = 'replace-context';

const SECRET_WORDS = ['zephyr', 'quasar', 'nebula', 'vortex'];
const REPLACED_WORDS = ['zeal', 'quell', 'nadir', 'vent'];

const SUMMARIZER_SECRET_WORDS = [
  'zephyr',
  'quasar',
  'nebula',
  'vortex',
  'axiom',
  'zenith',
  'cobalt',
  'entropy',
  'fusion',
  'prism',
  'syntax',
  'quantum',
];

const BASE_SYSTEM_PROMPT =
  'You are a helpful assistant. Answer concisely. If you do not know something, say so.';

function createMaxMessagesAgent(): Agent {
  const agent: Agent = {
    id: MAX_MESSAGES_AGENT_ID,
    hash: 'max-6-hash',
    name: 'Max-6-Messages',
    config: {
      systemPrompt: BASE_SYSTEM_PROMPT,
      toolIds: ['word_of_the_day'],
      messageHistory: { maxMessages: 6 },
    },
  };
  return agent;
}

function createSummarizerAgent(): Agent {
  const agent: Agent = {
    id: SUMMARIZER_AGENT_ID,
    hash: 'summarizer-hash',
    name: 'Summarizer',
    config: {
      systemPrompt: BASE_SYSTEM_PROMPT,
      toolIds: ['word_of_the_day'],
      messageHistory: {
        summarizeWhenOver: { threshold: 8, keep: 4 },
      },
    },
  };
  return agent;
}

function createReplaceAgent(): Agent {
  const replacementMap: Record<string, string> = Object.fromEntries(
    SECRET_WORDS.map((w, i) => [w, REPLACED_WORDS[i]]),
  );

  function replaceInText(text: string): string {
    let result = text;
    for (const [from, to] of Object.entries(replacementMap)) {
      result = result.split(from).join(to);
    }
    return result;
  }

  function transformContent(content: unknown): unknown {
    if (typeof content === 'string') return replaceInText(content);
    if (Array.isArray(content)) {
      return (content as { type?: string; text?: string }[]).map((block) =>
        block.type === 'text' && typeof block.text === 'string'
          ? { ...block, text: replaceInText(block.text) }
          : block,
      );
    }
    return content;
  }

  const agent: Agent = {
    id: REPLACE_AGENT_ID,
    hash: 'replace-hash',
    name: 'Replace Context',
    config: {
      systemPrompt: BASE_SYSTEM_PROMPT,
      toolIds: ['word_of_the_day'],
      messageHistory: {
        customTransform: (msgs) =>
          msgs.map((msg) => {
            const content = (msg as { content?: unknown }).content;
            const newContent = transformContent(content ?? '') as string;
            if (msg instanceof HumanMessage) return new HumanMessage(newContent);
            if (msg instanceof AIMessage) return new AIMessage(newContent);
            return msg;
          }),
      },
    },
  };
  return agent;
}

describe('sendMessage message history control (e2e)', () => {
  const userId = 'e2e-msg-history-user';

  beforeAll(async () => {
    await setupCheckpointer();
    agentsMock.setup([
      { id: MAX_MESSAGES_AGENT_ID, create: createMaxMessagesAgent },
      { id: SUMMARIZER_AGENT_ID, create: createSummarizerAgent },
      { id: REPLACE_AGENT_ID, create: createReplaceAgent },
    ]);
  }, 30000);

  afterAll(async () => {
    await teardownCheckpointer();
    await destroyKnex();
    jest.restoreAllMocks();
  });

  const SECRET_WORDS_QUESTION =
    'What was my first secret word from this convo? Reply with only the secret word from that message.';

  async function runSecretWordsScenario(
    agentId: string | undefined,
  ): Promise<{ response: string; threadId: string }> {
    const threadId = `e2e-secret-words-${Date.now()}-${agentId ?? 'default'}`;
    for (let i = 0; i < SECRET_WORDS.length; i++) {
      await sendMessage({
        userId,
        threadId,
        message: `My secret word is ${SECRET_WORDS[i]}. Just say ok`,
        agentId,
      });
    }
    const result = await sendMessage({
      userId,
      threadId,
      message: SECRET_WORDS_QUESTION,
      agentId,
    });
    return { response: result.response, threadId };
  }

  test('default agent remembers first secret word', async () => {
    const startMs = Date.now();
    const { response, threadId } = await runSecretWordsScenario(undefined);
    const stats = await computeTimingStats(threadId, startMs);
    logTimingStats('default agent remembers first secret word', stats);
    expect(response).toContain(SECRET_WORDS[0]);
  }, 90000);

  test('maxMessages agent truncates - only remembers from message 3', async () => {
    const startMs = Date.now();
    const { response, threadId } = await runSecretWordsScenario(MAX_MESSAGES_AGENT_ID);
    const stats = await computeTimingStats(threadId, startMs);
    logTimingStats('maxMessages agent truncates - only remembers from message 3', stats);
    expect(response).not.toContain(SECRET_WORDS[0]);
    expect(response).toContain(SECRET_WORDS[2]);
  }, 90000);

  test('customTransform replaces words - agent sees replaced content', async () => {
    const startMs = Date.now();
    const { response, threadId } = await runSecretWordsScenario(REPLACE_AGENT_ID);
    const stats = await computeTimingStats(threadId, startMs);
    logTimingStats('customTransform replaces words - agent sees replaced content', stats);
    expect(response).toContain(REPLACED_WORDS[0]);
  }, 90000);

  test('summarization preserves context when threshold exceeded', async () => {
    const startMs = Date.now();
    const threadId = `e2e-summarizer-${Date.now()}`;
    for (let i = 0; i < SUMMARIZER_SECRET_WORDS.length; i++) {
      await sendMessage({
        userId,
        threadId,
        message: `My secret word is ${SUMMARIZER_SECRET_WORDS[i]}. Just say ok`,
        agentId: SUMMARIZER_AGENT_ID,
      });
    }
    const result = await sendMessage({
      userId,
      threadId,
      message:
        'List ALL of the secret words I shared in this conversation. Include every one.',
      agentId: SUMMARIZER_AGENT_ID,
    });
    const stats = await computeTimingStats(threadId, startMs);
    logTimingStats('summarization preserves context when threshold exceeded', stats);
    const responseLower = result.response.toLowerCase();
    for (const word of SUMMARIZER_SECRET_WORDS) {
      expect(responseLower).toContain(word.toLowerCase());
    }
  }, 180000);
});
