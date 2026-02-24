import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  agentsDbDelete,
  agentsDbGetById,
  agentsDbInsert,
  agentsDbList,
  agentsDbUpdate,
  computeAgentHash,
} from '../lib/agents-db';
import type { Agent, AgentConfig } from '../lib/agents-types';

export interface CreateAgentDto {
  id: string;
  name: string;
  config: string | AgentConfig;
}

export interface UpdateAgentDto {
  name: string;
  config: string | AgentConfig;
}

const AGENT_ID_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$/;

function validateAgentId(id: string): string {
  const trimmed = id?.trim();
  if (!trimmed) {
    throw new BadRequestException('id is required');
  }
  if (!AGENT_ID_REGEX.test(trimmed)) {
    throw new BadRequestException(
      'id must be 3-64 chars, alphanumeric, hyphen, or underscore, starting with alphanumeric',
    );
  }
  return trimmed;
}

function parseConfig(raw: string | AgentConfig): AgentConfig {
  if (typeof raw === 'object' && raw !== null) {
    const c = raw as { systemPrompt?: unknown; toolIds?: unknown };
    const result: AgentConfig = {
      systemPrompt: typeof c.systemPrompt === 'string' ? c.systemPrompt : '',
      toolIds: Array.isArray(c.toolIds)
        ? (c.toolIds as string[]).filter((x) => typeof x === 'string')
        : [],
    };
    return result;
  }
  if (typeof raw !== 'string') {
    throw new BadRequestException('config must be a JSON string or object');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BadRequestException('config is invalid JSON');
  }
  if (parsed == null || typeof parsed !== 'object') {
    throw new BadRequestException('config must be a JSON object');
  }
  const c = parsed as { systemPrompt?: unknown; toolIds?: unknown };
  const result: AgentConfig = {
    systemPrompt: typeof c.systemPrompt === 'string' ? c.systemPrompt : '',
    toolIds: Array.isArray(c.toolIds)
      ? (c.toolIds as string[]).filter((x) => typeof x === 'string')
      : [],
  };
  return result;
}

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

  async create(dto: CreateAgentDto): Promise<Agent> {
    const id = validateAgentId(dto.id);
    const config = parseConfig(dto.config);
    const hash = computeAgentHash({ name: dto.name, config });
    const result = await agentsDbInsert({ id, hash, name: dto.name, config });
    return result;
  }

  async update(id: string, dto: UpdateAgentDto): Promise<Agent> {
    const existing = await agentsDbGetById(id);
    if (!existing) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    const config = parseConfig(dto.config);
    const hash = computeAgentHash({ name: dto.name, config });
    const result = await agentsDbUpdate(id, { hash, name: dto.name, config });
    return result;
  }

  async delete(id: string): Promise<void> {
    const existing = await agentsDbGetById(id);
    if (!existing) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    await agentsDbDelete(id);
  }
}
