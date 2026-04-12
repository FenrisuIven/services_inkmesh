import * as p from 'drizzle-orm/pg-core';

import { projectsSchema } from './projects.schema';
import { draftTable } from './draft.table';

export const projectTable = projectsSchema.table('projects', {
  id: p.uuid().defaultRandom().primaryKey(),
  name: p.text().notNull(),
  description: p.text(),
  draftId: p.uuid('draft_id').references(() => draftTable.id),
});
