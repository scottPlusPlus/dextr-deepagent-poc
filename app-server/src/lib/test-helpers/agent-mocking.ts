import type { Agent, AgentRuntime } from '../agents-types';

export type LazyAgent = {
  id: string;
  create: () => Agent | AgentRuntime | Promise<Agent | AgentRuntime>;
};

export type AgentOrLazy = Agent | AgentRuntime | LazyAgent;

const agentsById = new Map<string, AgentOrLazy>();

const mockGetById = jest.fn().mockImplementation(
  async (id: string): Promise<Agent | AgentRuntime | null> => {
    const entry = agentsById.get(id);
    if (entry == null) {
      return null;
    }
    if ('create' in entry && typeof entry.create === 'function') {
      return Promise.resolve(entry.create());
    }
    return entry as Agent | AgentRuntime;
  },
);

export type MockedAgentsDbHook = {
  setup: (agents: AgentOrLazy[]) => void;
  getMock: () => jest.MockedFunction<
    (id: string) => Promise<Agent | AgentRuntime | null>
  >;
};

const AGENTS_DB_PATH = '../agents-db';

/**
 * Returns a factory for jest.mock. Use in an inline factory to avoid hoisting issues.
 * Path is fixed relative to this helper (agents-db lives at ../agents-db).
 */
function getAgentsDbMockFactory(): () => Record<string, unknown> {
  return function factory(): Record<string, unknown> {
    const actual = jest.requireActual<Record<string, unknown>>(AGENTS_DB_PATH);
    const result: Record<string, unknown> = { ...actual };
    result.agentsDbGetById = mockGetById;
    return result;
  };
}

/**
 * Returns the hook to configure agents. Call setup(agents) in beforeAll/beforeEach.
 * Use with getAgentsDbMockFactory for jest.mock - no import-order gymnastics.
 *
 * @example
 * jest.mock('./lib/agents-db', () => getAgentsDbMockFactory()());
 * const agentsMock = setupMockedAgentsDb();
 * beforeAll(() => agentsMock.setup([createPirateAgent(), createButlerAgent()]));
 */
function setupMockedAgentsDb(): MockedAgentsDbHook {
  const setup = (agents: AgentOrLazy[]): void => {
    agentsById.clear();
    for (const entry of agents) {
      agentsById.set(entry.id, entry);
    }
  };

  const result: MockedAgentsDbHook = {
    setup,
    getMock: () => mockGetById,
  };
  return result;
}

export { getAgentsDbMockFactory, setupMockedAgentsDb };
