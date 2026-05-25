import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function runMigration() {
  console.log('--- Manual Migration Started ---');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    console.log('Applying migrations from ./drizzle ...');
    await migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Migration FAILED!');
    console.error('Error Details:', error);
    if (error.stack) {
      console.error('Stack Trace:', error.stack);
    }
  } finally {
    await pool.end();
    console.log('--- Manual Migration Finished ---');
  }
}

runMigration().catch((err) => {
  console.error('Unhandled Error in runMigration:', err);
  process.exit(1);
});
