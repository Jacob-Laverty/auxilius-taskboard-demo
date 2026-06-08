import type { MigrationBuilder } from 'node-pg-migrate';

export const shorthands: undefined = undefined;

export function up(pgm: MigrationBuilder): void {
  // NOTE: Needs to match expected typedef in frontend and backend.
  // Non demo implementation would guarantee type safety across the whole project
  pgm.createType('task_status', ['todo', 'in_progress', 'done']);

  pgm.createTable('tasks', {
    // Could consider not using uuid here and relying on an incremental id
    // Task IDs weren't in scope so I'll leave it for now. Might be a neat
    // demo of iterating on the schema if there's time.
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title: { type: 'text', notNull: true },
    description: { type: 'text' },
    status: { type: 'task_status', notNull: true, default: 'todo' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    // TZ type actually pretty important here if we'd expect users in multiple different timezones
    // to collaborate on the app. In a real production setting I'd force everything to be stored in 
    // the DB in UTC time and then converted on the frontend. For now we'll just take what we're given
    // and be aware that the TZ is included.
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // We would anticipate loading tasks by status so fairly confident we can index here
  pgm.createIndex('tasks', 'status');

  // Assigning tasks to a user wasn't in scope and was specified as left out
  // But we could pretty trivially add a users table, and an fKey to the task for the assigned user
  // with basically no overhead. Again maybe a nice follow-up time permitting
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable('tasks');
  pgm.dropType('task_status');
}