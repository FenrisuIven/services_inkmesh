import * as p from 'drizzle-orm/pg-core';

export const charactersSchema = p.pgSchema('characters');
export const junctionsSchema = p.pgSchema('junctions');
export const projectsSchema = p.pgSchema('projects');
export const usersSchema = p.pgSchema('users');

export const characterTable = charactersSchema.table('characters', {
  id: p.uuid().defaultRandom().primaryKey(),
  name: p.text().notNull(),
  description: p.text(),
  ownerAuth0Id: p.text('owner_auth0_id').notNull(),
});

export const documentTable = projectsSchema.table('documents', {
  id: p.uuid().defaultRandom().primaryKey(),
  name: p.text().notNull(),
  periodStart: p.text('period_start'),
  periodEnd: p.text('period_end'),
  filePath: p.text('file_path'),
  beforeDocId: p.uuid('before_doc_id'),
  afterDocId: p.uuid('after_doc_id'),
});

export const draftTable = projectsSchema.table('drafts', {
  id: p.uuid().defaultRandom().primaryKey(),
});

export const memberTable = usersSchema.table('members', {
  id: p.uuid().defaultRandom().primaryKey(),
  username: p.text().notNull(),
  auth0_id: p.text('auth0_id').notNull(),
});

export const projectRoleEnum = junctionsSchema.enum('project_role', [
  'OWNER',
  'MODERATOR',
  'WRITER',
]);

export const projectTable = projectsSchema.table('projects', {
  id: p.uuid().defaultRandom().primaryKey(),
  name: p.text().notNull(),
  description: p.text(),
  draftId: p.uuid('draft_id').references(() => draftTable.id),
});

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
