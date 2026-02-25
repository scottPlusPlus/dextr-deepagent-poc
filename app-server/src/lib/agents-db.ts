import * as crypto from 'crypto';
import { clearAgentCache } from './agent-cache';
import { getKnex } from './knex-instance-db';
import type {
  Agent,
  AgentConfig,
  AgentInsertRow,
  AgentUpdateRow,
} from './agents-types';
import {
  DEFAULT_MESSAGE_HISTORY_CONFIG,
  parseMessageHistoryConfig,
} from './message-history-types';

function rowToAgent(row: {
  id: string;
  hash: string;
  name: string;
  config: unknown;
}): Agent {
  const config =
    typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
  const raw = config as { systemPrompt?: unknown; toolIds?: unknown; messageHistory?: unknown };
  const mh = parseMessageHistoryConfig(raw.messageHistory);
  const typedConfig: AgentConfig = {
    systemPrompt: (raw.systemPrompt as string) ?? '',
    toolIds: Array.isArray(raw.toolIds) ? (raw.toolIds as string[]) : [],
    messageHistory: mh ?? DEFAULT_MESSAGE_HISTORY_CONFIG,
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
  const config: AgentConfig = {
    ...row.config,
    messageHistory: row.config.messageHistory ?? DEFAULT_MESSAGE_HISTORY_CONFIG,
  };
  const insertPayload = {
    id: row.id,
    hash: row.hash,
    name: row.name,
    config: JSON.stringify(config),
  };
  const result = await knex('agents')
    .insert(insertPayload)
    .returning(['id', 'hash', 'name', 'config']);
  const r = result[0] as { id: string; hash: string; name: string; config: unknown };
  clearAgentCache();
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
  const config: AgentConfig = {
    ...row.config,
    messageHistory: row.config.messageHistory ?? DEFAULT_MESSAGE_HISTORY_CONFIG,
  };
  const updatePayload = {
    hash: row.hash,
    name: row.name,
    config: JSON.stringify(config),
  };
  const result = await knex('agents')
    .where('id', id)
    .update(updatePayload)
    .returning(['id', 'hash', 'name', 'config']);
  const r = result[0] as { id: string; hash: string; name: string; config: unknown };
  clearAgentCache();
  return rowToAgent(r);
}

export async function agentsDbDelete(id: string): Promise<void> {
  const knex = getKnex();
  await knex('agents').where('id', id).del();
}
