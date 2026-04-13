import * as p from 'drizzle-orm/pg-core';

import { junctionsSchema } from './junctions.schema';

import { projectTable } from './project.table';
import { memberTable } from './member.table';
import { projectRoleEnum } from './project.role.enum';

export const projectToMemberTable = junctionsSchema.table(
  'project_to_member',
  {
    projectId: p.uuid('project_id').references(() => projectTable.id),
    memberId: p.uuid('member_id').references(() => memberTable.id),
    role: projectRoleEnum(),
  },
  (table) => [
    p.primaryKey({
      name: 'project_to_member_pkey',
      columns: [table.projectId, table.memberId],
    }),
  ],
);
