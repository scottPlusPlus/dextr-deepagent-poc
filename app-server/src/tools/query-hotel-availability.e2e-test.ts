import 'dotenv/config';
import { setupCheckpointer, teardownCheckpointer } from '../langx/checkpointer-instance';
import {
  getAgentsDbMockFactory,
  setupMockedAgentsDb,
} from '../lib/test-helpers/agent-mocking';
import { sendMessage } from '../send-message';
import type { Agent } from '../lib/agents-types';

jest.mock('../lib/agents-db', () => getAgentsDbMockFactory()());
const agentsMock = setupMockedAgentsDb();

const HOTEL_AGENT_ID = 'test-hotel-agent';

const HOTEL_SYSTEM_PROMPT =
  'You are a hotel concierge. When guests ask about room availability, you MUST use the query_hotel_availability tool with the date and party size from their message. Return the tool results to the guest.';

function createHotelAgent(): Agent {
  const agent: Agent = {
    id: HOTEL_AGENT_ID,
    hash: 'hotel-hash',
    name: 'Hotel Concierge',
    config: {
      systemPrompt: HOTEL_SYSTEM_PROMPT,
      toolIds: ['query_hotel_availability'],
    },
  };
  return agent;
}

describe('sendMessage with hotel availability agent (e2e)', () => {
  const userId = 'e2e-hotel-user';

  beforeAll(async () => {
    await setupCheckpointer();
    agentsMock.setup([createHotelAgent()]);
  }, 30000);

  afterAll(async () => {
    await teardownCheckpointer();
    jest.restoreAllMocks();
  });

  it('returns room availability when user asks about rooms', async () => {
    const threadId = `e2e-hotel-thread-${Date.now()}`;
    const result = await sendMessage({
      userId,
      threadId,
      message: 'Do you have any rooms available for Jan 1 for 2 people?',
      agentId: HOTEL_AGENT_ID,
    });
    expect(result.response).toContain('standard room');
    expect(result.response).toContain('12.34');
  }, 60000);

  it('returns empty availability when no rooms are available', async () => {
    const threadId = `e2e-hotel-empty-thread-${Date.now()}`;
    const result = await sendMessage({
      userId,
      threadId,
      message: 'Any rooms for Jan 3 for 2 people?',
      agentId: HOTEL_AGENT_ID,
    });
    expect(result.response).toContain('[]');
  }, 60000);
});
