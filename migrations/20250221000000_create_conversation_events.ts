import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('conversation_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('thread_id').notNullable();
    table.text('user_id').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.text('type').notNullable();
    table.jsonb('payload').notNullable();
    table.uuid('agent_id').nullable();
    table.text('agent_hash').nullable();
  });
  await knex.schema.raw(
    'CREATE INDEX idx_conversation_events_thread_id ON conversation_events(thread_id)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('conversation_events');
}
