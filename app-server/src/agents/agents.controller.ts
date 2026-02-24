import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { Agent } from '../lib/agents-types';
import {
  AgentsService,
  type CreateAgentDto,
  type UpdateAgentDto,
} from './agents.service';

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

  @Post()
  async create(@Body() body: CreateAgentDto): Promise<Agent> {
    const result = await this.agentsService.create(body);
    return result;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAgentDto,
  ): Promise<Agent> {
    const result = await this.agentsService.update(id, body);
    return result;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.agentsService.delete(id);
  }
}
