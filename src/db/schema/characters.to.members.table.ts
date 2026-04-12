import * as p from 'drizzle-orm/pg-core';

import { junctionsSchema } from './junctions.schema';

import { characterTable } from './character.table';
import { memberTable } from './member.table';

export const characterToMemberTable = junctionsSchema.table(
  'character_to_member',
  {
    characterId: p.uuid('character_id').references(() => characterTable.id),
    memberId: p.uuid('member_id').references(() => memberTable.id),
  },
  (table) => [
    p.primaryKey({
      name: 'character_to_member_pkey',
      columns: [table.characterId, table.memberId],
    }),
  ],
);
