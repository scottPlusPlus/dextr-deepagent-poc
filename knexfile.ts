import 'dotenv/config';
import type { Knex } from 'knex';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error('DATABASE_URL or POSTGRES_URL must be set');
  }
  return url;
}

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: getDatabaseUrl(),
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection: getDatabaseUrl(),
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
  },
};

export default config;
