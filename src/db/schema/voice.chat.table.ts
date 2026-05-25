import * as p from 'drizzle-orm/pg-core';

import { chatsSchema } from './chats.schema';
import { projectTable } from './project.table';

export const voiceChatTable = chatsSchema.table('voice_chat', {
  id: p.uuid().defaultRandom().primaryKey(),
  projectId: p
    .uuid('project_id')
    .notNull()
    .references(() => projectTable.id),
});
