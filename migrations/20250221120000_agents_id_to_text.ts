import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE conversation_events ALTER COLUMN agent_id TYPE text USING agent_id::text',
  );
  await knex.schema.dropTableIfExists('agents');
  await knex.schema.createTable('agents', (table) => {
    table.text('id').primary();
    table.text('hash').notNullable();
    table.text('name').notNullable();
    table.jsonb('config').notNullable();
  });
  await knex.schema.raw('CREATE INDEX idx_agents_hash ON agents(hash)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('agents');
  await knex.schema.createTable('agents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('hash').notNullable();
    table.text('name').notNullable();
    table.jsonb('config').notNullable();
  });
  await knex.schema.raw('CREATE INDEX idx_agents_hash ON agents(hash)');
  await knex.raw(
    'ALTER TABLE conversation_events ALTER COLUMN agent_id TYPE uuid USING agent_id::uuid',
  );
}
