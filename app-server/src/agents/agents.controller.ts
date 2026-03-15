import { Controller, Get, Param } from '@nestjs/common';
import type { Agent } from '../lib/agents-types';
import { AgentsService } from './agents.service';

@Controller('api/agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  async list(): Promise<Agent[]> {
    const result = await this.agentsService.list();
    return result;
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Agent> {
    const result = await this.agentsService.getById(id);
    return result;
  }
}
