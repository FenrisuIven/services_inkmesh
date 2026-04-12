import * as p from 'drizzle-orm/pg-core';

import { junctionsSchema } from './junctions.schema';

import { projectTable } from './project.table';
import { documentTable } from './document.table';

export const projectToDocumentsTable = junctionsSchema.table(
  'project_to_documents',
  {
    projectId: p.uuid('project_id').references(() => projectTable.id),
    documentId: p.uuid('document_id').references(() => documentTable.id),
  },
  (table) => [
    p.primaryKey({
      name: 'project_to_document_pkey',
      columns: [table.projectId, table.documentId],
    }),
  ],
);
