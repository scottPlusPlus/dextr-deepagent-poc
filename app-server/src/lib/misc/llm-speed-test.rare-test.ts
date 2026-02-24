import 'dotenv/config';
import { setupCheckpointer, teardownCheckpointer } from '../../langx/checkpointer-instance';
import { destroyKnex } from '../knex-instance-db';
import {
  getAgentsDbMockFactory,
  setupMockedAgentsDb,
} from '../test-helpers/agent-mocking';
import { __for_testing } from '../../agent';
import { llmDirectChat } from './llm-api-direct';
import type { PreviousMessage } from './llm-api-direct';
import { sendMessage } from '../../send-message';
import type { Agent } from '../agents-types';

jest.mock('../agents-db', () => getAgentsDbMockFactory()());
const agentsMock = setupMockedAgentsDb();

const SPEED_TEST_AGENT_ID = 'speed-test-agent';
const SYSTEM_PROMPT = 'please be friendly, helpful, and concise';

const CONVERSATION_TURNS: string[] = [
  "Hi! What's your favorite color?",
  "That's nice. What about a hobby?",
  "Can you give me a short tip for staying productive?",
  "Can you remind me what you said at the very beginning of our conversation?",
];

function createSpeedTestAgent(): Agent {
  const agent: Agent = {
    id: SPEED_TEST_AGENT_ID,
    hash: 'speed-test-hash',
    name: 'Speed Test Agent',
    config: {
      systemPrompt: SYSTEM_PROMPT,
      toolIds: [],
    },
  };
  return agent;
}

async function runConversationWithLlmDirectChat(
  userId: string,
): Promise<{ responses: string[]; totalMs: number }> {
  const previousMessages: PreviousMessage[] = [];
  const responses: string[] = [];
  const startMs = Date.now();

  for (const userMessage of CONVERSATION_TURNS) {
    const response = await llmDirectChat({
      userId,
      agentId: SPEED_TEST_AGENT_ID,
      message: userMessage,
      previousMessages: [...previousMessages],
    });
    responses.push(response);
    previousMessages.push({ role: 'user', content: userMessage });
    previousMessages.push({ role: 'assistant', content: response });
  }

  const totalMs = Date.now() - startMs;
  const result = { responses, totalMs };
  return result;
}

async function runConversationWithSendMessage(
  userId: string,
): Promise<{ responses: string[]; totalMs: number }> {
  const threadId = `e2e-speed-test-${Date.now()}`;
  const responses: string[] = [];
  const startMs = Date.now();

  for (const userMessage of CONVERSATION_TURNS) {
    const output = await sendMessage({
      userId,
      threadId,
      message: userMessage,
      agentId: SPEED_TEST_AGENT_ID,
    });
    responses.push(output.response);
  }

  const totalMs = Date.now() - startMs;
  const result = { responses, totalMs };
  return result;
}

describe('llm speed comparison (e2e)', () => {
  const userId = 'e2e-speed-test-user';

  beforeAll(async () => {
    await setupCheckpointer();
    agentsMock.setup([{ id: SPEED_TEST_AGENT_ID, create: createSpeedTestAgent }]);
  }, 30000);

  afterAll(async () => {
    await teardownCheckpointer();
    await destroyKnex();
    jest.restoreAllMocks();
  });

  test('llmDirectChat vs sendMessage - same 4-turn conversation, measure completion time', async () => {
    function assertResponses(responses: string[]): void {
      for (const r of responses) {
        expect(r).toBeDefined();
        expect(typeof r).toBe('string');
        expect(r.length).toBeGreaterThan(0);
      }
    }

    // Run 1
    const directResult1 = await runConversationWithLlmDirectChat(userId);
    const sendMsgResult1 = await runConversationWithSendMessage(userId);
    assertResponses(directResult1.responses);
    assertResponses(sendMsgResult1.responses);

    // Run 2 - to see if time differences are from initial setup or persist
    const directResult2 = await runConversationWithLlmDirectChat(userId);
    const sendMsgResult2 = await runConversationWithSendMessage(userId);
    assertResponses(directResult2.responses);
    assertResponses(sendMsgResult2.responses);

    // Run 3 - without LLM cache
    __for_testing.setShouldUseLlmCache(false);
    __for_testing.clearAgentCache();
    try {
      const directResult3 = await runConversationWithLlmDirectChat(userId);
      const sendMsgResult3 = await runConversationWithSendMessage(userId);
      assertResponses(directResult3.responses);
      assertResponses(sendMsgResult3.responses);

      console.log(
        `[timing run 1] llmDirectChat: ${directResult1.totalMs}ms | sendMessage: ${sendMsgResult1.totalMs}ms (${CONVERSATION_TURNS.length} turns, with cache)
[timing run 2] llmDirectChat: ${directResult2.totalMs}ms | sendMessage: ${sendMsgResult2.totalMs}ms (${CONVERSATION_TURNS.length} turns, with cache)
[timing run 3] llmDirectChat: ${directResult3.totalMs}ms | sendMessage: ${sendMsgResult3.totalMs}ms (${CONVERSATION_TURNS.length} turns, no cache)`,
      );
    } finally {
      __for_testing.setShouldUseLlmCache(null);
    }
  }, 240000);
});
