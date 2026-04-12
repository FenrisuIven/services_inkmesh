import * as p from 'drizzle-orm/pg-core';

import { projectsSchema } from './projects.schema';

export const documentTable = projectsSchema.table('documents', {
  id: p.uuid().defaultRandom().primaryKey(),
  name: p.text().notNull(),
  periodStart: p.text('period_start'),
  periodEnd: p.text('period_end'),
  filePath: p.text('file_path'),
  beforeDocId: p.uuid('before_doc_id'),
  afterDocId: p.uuid('after_doc_id'),
});
