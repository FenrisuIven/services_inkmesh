import * as p from 'drizzle-orm/pg-core';

import { usersSchema } from './users.schema';

export const memberTable = usersSchema.table('members', {
  id: p.uuid().defaultRandom().primaryKey(),
  username: p.text().notNull(),
  auth0_id: p.text('auth0_id').notNull(),
});
