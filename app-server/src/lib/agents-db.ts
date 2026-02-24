import * as crypto from 'crypto';
import { getKnex } from './knex-instance-db';
import type {
  Agent,
  AgentConfig,
  AgentInsertRow,
  AgentUpdateRow,
} from './agents-types';

function rowToAgent(row: {
  id: string;
  hash: string;
  name: string;
  config: unknown;
}): Agent {
  const config =
    typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
  const typedConfig: AgentConfig = {
    systemPrompt: config.systemPrompt ?? '',
    toolIds: Array.isArray(config.toolIds) ? config.toolIds : [],
    messageHistory: config.messageHistory,
  };
  const result: Agent = {
    id: row.id,
    hash: row.hash,
    name: row.name,
    config: typedConfig,
  };
  return result;
}

export async function agentsDbGetById(id: string): Promise<Agent | null> {
  const knex = getKnex();
  const row = await knex('agents').where('id', id).first();
  if (!row) return null;
  return rowToAgent(row as Parameters<typeof rowToAgent>[0]);
}

export async function agentsDbInsert(row: AgentInsertRow): Promise<Agent> {
  const knex = getKnex();
  const insertPayload = {
    id: row.id,
    hash: row.hash,
    name: row.name,
    config: JSON.stringify(row.config),
  };
  const result = await knex('agents')
    .insert(insertPayload)
    .returning(['id', 'hash', 'name', 'config']);
  const r = result[0] as { id: string; hash: string; name: string; config: unknown };
  return rowToAgent(r);
}

export async function agentsDbList(): Promise<Agent[]> {
  const knex = getKnex();
  const rows = await knex('agents').select('id', 'hash', 'name', 'config');
  return rows.map((r) => rowToAgent(r as Parameters<typeof rowToAgent>[0]));
}

export function computeAgentHash(agent: {
  name: string;
  config: AgentConfig;
}): string {
  const obj = { name: agent.name, config: agent.config };
  const str = JSON.stringify(obj);
  const result = crypto.createHash('md5').update(str).digest('hex');
  return result;
}

export async function agentsDbUpdate(
  id: string,
  row: AgentUpdateRow,
): Promise<Agent> {
  const knex = getKnex();
  const updatePayload = {
    hash: row.hash,
    name: row.name,
    config: JSON.stringify(row.config),
  };
  const result = await knex('agents')
    .where('id', id)
    .update(updatePayload)
    .returning(['id', 'hash', 'name', 'config']);
  const r = result[0] as { id: string; hash: string; name: string; config: unknown };
  return rowToAgent(r);
}

export async function agentsDbDelete(id: string): Promise<void> {
  const knex = getKnex();
  await knex('agents').where('id', id).del();
}
