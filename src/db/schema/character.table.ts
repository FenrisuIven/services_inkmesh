import * as p from 'drizzle-orm/pg-core';

import { charactersSchema } from './characters.schema';

export const characterTable = charactersSchema.table('characters', {
  id: p.uuid().defaultRandom().primaryKey(),
  name: p.text().notNull(),
  description: p.text(),
  ownerAuth0Id: p.text('owner_auth0_id').notNull(),
  isPublic: p.boolean('is_public').default(false).notNull(),
});
