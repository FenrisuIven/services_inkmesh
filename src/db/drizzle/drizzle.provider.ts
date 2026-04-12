import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export const DRIZZLE_CLIENT = 'DRIZZLE_CLIENT';

export const drizzleProvider = {
  provide: DRIZZLE_CLIENT,
  useFactory: () => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    return drizzle(pool) as NodePgDatabase;
  },
};
