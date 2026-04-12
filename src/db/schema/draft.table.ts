import * as p from 'drizzle-orm/pg-core';

import { projectsSchema } from './projects.schema';

export const draftTable = projectsSchema.table('drafts', {
  id: p.uuid().defaultRandom().primaryKey(),
});
