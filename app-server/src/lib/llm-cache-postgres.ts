import crypto from 'node:crypto';
import {
  BaseCache,
  deserializeStoredGeneration,
  serializeGeneration,
} from '@langchain/core/caches';
import type { Generation } from '@langchain/core/outputs';
import { getKnex } from './knex-instance-db';
import { truncateString } from './utils-agnostic/string-utils';

function md5KeyEncoder(prompt: string, llmKey: string): string {
  return crypto
    .createHash('md5')
    .update(prompt + '_' + llmKey)
    .digest('hex');
}

class PostgresLlmCache extends BaseCache<Generation[]> {
  constructor() {
    super();
    this.makeDefaultKeyEncoder(md5KeyEncoder);
  }

  async lookup(prompt: string, llmKey: string): Promise<Generation[] | null> {
    
    const key = this.keyEncoder(prompt, llmKey);
    console.debug(`llm-cache-postgres with len: ${prompt.length} and key ${truncateString(key, 8)}`);
    const knex = getKnex();
    const row = await knex('llm_cache').where('key', key).first();
    if (!row?.value) return null;
    const stored: unknown = JSON.parse(row.value as string);
    if (!Array.isArray(stored)) return null;
    const result: Generation[] = stored.map((item) => {
      const deserialized = deserializeStoredGeneration(item);
      const gen: Generation = { text: deserialized.text };
      if (deserialized.message != null) {
        (gen as Generation & { message: unknown }).message =
          deserialized.message;
      }
      return gen;
    });
    return result;
  }

  async update(
    prompt: string,
    llmKey: string,
    value: Generation[],
  ): Promise<void> {
    const key = this.keyEncoder(prompt, llmKey);
    const stored = value.map((gen) => serializeGeneration(gen));
    const valueStr = JSON.stringify(stored);
    const knex = getKnex();
    const now = knex.fn.now();
    await knex('llm_cache')
      .insert({
        key,
        value: valueStr,
        created_at: now,
        updated_at: now,
      })
      .onConflict('key')
      .merge(['value', 'updated_at']);
  }
}

let cacheInstance: PostgresLlmCache | null = null;

export function createPostgresLlmCache(): PostgresLlmCache {
  if (!cacheInstance) {
    cacheInstance = new PostgresLlmCache();
  }
  return cacheInstance;
}
