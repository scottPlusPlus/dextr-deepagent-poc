import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('agents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('hash').notNullable();
    table.text('name').notNullable();
    table.jsonb('config').notNullable();
  });
  await knex.schema.raw('CREATE INDEX idx_agents_hash ON agents(hash)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('agents');
}
