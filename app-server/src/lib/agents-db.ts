import { fetchAgentById, fetchAgentsList } from './dextr-intern-api';
import type { Agent } from './agents-types';

export async function agentsDbGetById(id: string): Promise<Agent | null> {
  return fetchAgentById(id);
}

export async function agentsDbList(): Promise<Agent[]> {
  return fetchAgentsList();
}
