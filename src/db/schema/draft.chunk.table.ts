import * as p from 'drizzle-orm/pg-core';

import { projectsSchema } from './projects.schema';
import { draftTable } from './draft.table';

export const draftChunkTable = projectsSchema.table('draft_chunks', {
  id: p.uuid().defaultRandom().primaryKey(),
  content: p.text(),
  draftId: p
    .uuid('draft_id')
    .notNull()
    .references(() => draftTable.id),
  order: p.integer().notNull(),
});
