import * as crypto from 'crypto';
import type { Agent, AgentConfig } from './agents-types';
import {
  DEFAULT_MESSAGE_HISTORY_CONFIG,
  parseMessageHistoryConfig,
} from './message-history-types';

/** Response shape from dextr-intern /api/artifacts/resolve-dextr-agent and /api/artifacts/dextr-agents */
interface DextrAgentResponse {
  name: string;
  systemPrompt: string;
  toolIds: string[];
  updated?: string;
  messageHistory?: {
    summarizeWhenOver?: { threshold: number; keep: number };
  };
}

function getBaseUrl(): string {
  const url = process.env.DEXTR_INTERN_API_URL?.trim();
  if (!url) {
    throw new Error('DEXTR_INTERN_API_URL is required');
  }
  return url.replace(/\/$/, '');
}

function getAuthToken(): string {
  const token = process.env.DEXTR_INTERN_AUTH_TOKEN?.trim();
  if (!token) {
    throw new Error('DEXTR_INTERN_AUTH_TOKEN is required');
  }
  return token;
}

function dextrAgentToAgent(d: DextrAgentResponse): Agent {
  const mh = parseMessageHistoryConfig(d.messageHistory);
  const config: AgentConfig = {
    systemPrompt: d.systemPrompt ?? '',
    toolIds: Array.isArray(d.toolIds) ? d.toolIds : [],
    messageHistory: mh ?? DEFAULT_MESSAGE_HISTORY_CONFIG,
  };
  const hash = computeHashFromConfig(d.name, config);
  return {
    id: d.name,
    hash,
    name: d.name,
    config,
  };
}

function computeHashFromConfig(name: string, config: AgentConfig): string {
  const obj = { name, config };
  const str = JSON.stringify(obj);
  return crypto.createHash('md5').update(str).digest('hex');
}

export async function fetchAgentById(id: string): Promise<Agent | null> {
  const baseUrl = getBaseUrl();
  const token = getAuthToken();
  const url = `${baseUrl}/api/artifacts/resolve-dextr-agent?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dextr-intern API error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as DextrAgentResponse;
  return dextrAgentToAgent(data);
}

export async function fetchAgentsList(limit?: number): Promise<Agent[]> {
  const baseUrl = getBaseUrl();
  const token = getAuthToken();
  const limitParam = limit != null ? `limit=${limit}` : '';
  const url = `${baseUrl}/api/artifacts/dextr-agents${limitParam ? `?${limitParam}` : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dextr-intern API error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as DextrAgentResponse[];
  return data.map(dextrAgentToAgent);
}
