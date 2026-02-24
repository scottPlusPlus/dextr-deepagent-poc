import Knex from 'knex';
import { getDatabaseUrl } from '../config';

let knexInstance: Knex.Knex | null = null;

export function getKnex(): Knex.Knex {
  if (!knexInstance) {
    knexInstance = Knex({
      client: 'pg',
      connection: getDatabaseUrl(),
    });
  }
  return knexInstance;
}

export async function destroyKnex(): Promise<void> {
  if (knexInstance) {
    await knexInstance.destroy();
    knexInstance = null;
  }
}
