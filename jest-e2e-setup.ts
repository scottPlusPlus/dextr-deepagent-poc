import 'dotenv/config';
import knex from 'knex';
import type { Knex } from 'knex';
import knexConfig from './knexfile';

export default async function globalSetup(): Promise<void> {
  const env = process.env.NODE_ENV === 'test' ? 'development' : process.env.NODE_ENV ?? 'development';
  const config = (knexConfig as Record<string, Knex.Config>)[env];
  if (!config) return;
  const db = knex(config);
  await db.migrate.latest();
  await db.destroy();
}
