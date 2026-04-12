import * as p from 'drizzle-orm/pg-core';

import { junctionsSchema } from './junctions.schema';

import { projectTable } from './project.table';
import { characterTable } from './character.table';

export const projectToCharacterTable = junctionsSchema.table(
  'project_to_character',
  {
    projectId: p.uuid('project_id').references(() => projectTable.id),
    characterId: p.uuid('character_id').references(() => characterTable.id),
  },
  (table) => [
    p.primaryKey({
      name: 'project_to_character_pkey',
      columns: [table.projectId, table.characterId],
    }),
  ],
);
