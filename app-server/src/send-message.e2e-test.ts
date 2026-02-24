import 'dotenv/config';
import { setupCheckpointer, teardownCheckpointer } from './langx/checkpointer-instance';
import { sendMessage } from './send-message';
import { getConversationEvents } from './lib/get-conversation-events';
import { destroyKnex } from './lib/knex-instance-db';

describe('sendMessage and conversation events (e2e)', () => {
  const userId = 'e2e-test-user';
  const threadId = `e2e-thread-${Date.now()}`;

  beforeAll(async () => {
    await setupCheckpointer();
  }, 30000);

  afterAll(async () => {
    await teardownCheckpointer();
    await destroyKnex();
  });

  it('sends first message and gets hello response', async () => {
    const result = await sendMessage({
      userId,
      threadId,
      message: "hi my name is Daisy. please say 'hello'",
    });
    expect(result.response.toLowerCase()).toContain('hello');
  }, 60000);

  it('sends second message and agent remembers name', async () => {
    const result = await sendMessage({
      userId,
      threadId,
      message: 'do you remember my name?',
    });
    expect(result.response.toLowerCase()).toContain('daisy');
  }, 60000);

  it('conversation events exist with expected types', async () => {
    const events = await getConversationEvents(threadId);

    const types = events.map((e) => e.type);
    expect(types).toContain('userMessage');
    expect(types).toContain('llmRun');
    expect(types).toContain('agentMessage');

    const userMsg = events.find((e) => e.type === 'userMessage');
    expect(userMsg).toBeDefined();
    expect(userMsg?.payload).toHaveProperty('message');
    expect(typeof (userMsg?.payload as { message?: string }).message).toBe('string');

    const agentMsg = events.find((e) => e.type === 'agentMessage');
    expect(agentMsg).toBeDefined();
    expect(agentMsg?.payload).toHaveProperty('message');
    expect(typeof (agentMsg?.payload as { message?: string }).message).toBe('string');

    const llmRun = events.find((e) => e.type === 'llmRun');
    expect(llmRun).toBeDefined();
    expect(llmRun?.payload).toHaveProperty('inputs');
    expect(llmRun?.payload).toHaveProperty('outputs');
  });
});
