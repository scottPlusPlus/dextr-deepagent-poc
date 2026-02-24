import 'dotenv/config';
import { setupCheckpointer, teardownCheckpointer } from './langx/checkpointer-instance';
import {
  getAgentsDbMockFactory,
  setupMockedAgentsDb,
} from './lib/test-helpers/agent-mocking';
import { sendMessage } from './send-message';
import type { Agent } from './lib/agents-types';

jest.mock('./lib/agents-db', () => getAgentsDbMockFactory()());
const agentsMock = setupMockedAgentsDb();

const PIRATE_AGENT_ID = 'pirate';
const BUTLER_AGENT_ID = 'butler';

const PIRATE_SYSTEM_PROMPT =
  "You are a pirate. When asked to greet someone or say hello, your response MUST include the exact word 'ahoy' and the exact word 'matey'. Do not skip these words.";

const BUTLER_SYSTEM_PROMPT =
  "You are a formal butler. When asked to greet someone or say hello, your response MUST include the exact phrase 'as you wish' somewhere in it. Do not skip this phrase.";

function createPirateAgent(): Agent {
  const agent: Agent = {
    id: PIRATE_AGENT_ID,
    hash: 'pirate-hash',
    name: 'Pirate',
    config: {
      systemPrompt: PIRATE_SYSTEM_PROMPT,
      toolIds: ['get_current_time', 'word_of_the_day'],
    },
  };
  return agent;
}

function createButlerAgent(): Agent {
  const agent: Agent = {
    id: BUTLER_AGENT_ID,
    hash: 'butler-hash',
    name: 'Butler',
    config: {
      systemPrompt: BUTLER_SYSTEM_PROMPT,
      toolIds: ['get_current_time', 'word_of_the_day'],
    },
  };
  return agent;
}

describe('sendMessage multi-agent (e2e)', () => {
  const userId = 'e2e-multi-agent-user';

  beforeAll(async () => {
    await setupCheckpointer();
    agentsMock.setup([createPirateAgent(), createButlerAgent()]);
  }, 30000);

  afterAll(async () => {
    await teardownCheckpointer();
    jest.restoreAllMocks();
  });

  it('pirate agent responds with ahoy and matey', async () => {
    const threadId = `e2e-pirate-thread-${Date.now()}`;
    const result = await sendMessage({
      userId,
      threadId,
      message: 'Say hello',
      agentId: PIRATE_AGENT_ID,
    });
    const lower = result.response.toLowerCase();
    expect(lower).toContain('ahoy');
    expect(lower).toContain('matey');
  }, 60000);

  it('butler agent responds with as you wish', async () => {
    const threadId = `e2e-butler-thread-${Date.now()}`;
    const result = await sendMessage({
      userId,
      threadId,
      message: 'Greet me',
      agentId: BUTLER_AGENT_ID,
    });
    const lower = result.response.toLowerCase();
    expect(lower).toContain('as you wish');
  }, 60000);
});
