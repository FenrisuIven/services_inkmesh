import * as p from 'drizzle-orm/pg-core';

import { junctionsSchema } from './junctions.schema';

import { projectTable } from './project.table';
import { memberTable } from './member.table';

export const projectToMemberTable = junctionsSchema.table(
  'project_to_member',
  {
    projectId: p.uuid('project_id').references(() => projectTable.id),
    memberId: p.uuid('member_id').references(() => memberTable.id),
  },
  (table) => [
    p.primaryKey({
      name: 'project_to_member_pkey',
      columns: [table.projectId, table.memberId],
    }),
  ],
);
