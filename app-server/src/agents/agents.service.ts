import { Injectable, NotFoundException } from '@nestjs/common';
import { agentsDbGetById, agentsDbList } from '../lib/agents-db';
import type { Agent } from '../lib/agents-types';

@Injectable()
export class AgentsService {
  async list(): Promise<Agent[]> {
    const result = await agentsDbList();
    return result;
  }

  async getById(id: string): Promise<Agent> {
    const agent = await agentsDbGetById(id);
    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    return agent;
  }
}
