import * as p from 'drizzle-orm/pg-core';

import { chatsSchema } from './chats.schema';
import { chatRoomTable } from './chat.room.table';

export const messageTable = chatsSchema.table('messages', {
  id: p.uuid().defaultRandom().primaryKey(),
  senderName: p.text('sender_name'),
  content: p.text().notNull(),
  roomId: p
    .uuid()
    .references(() => chatRoomTable.id)
    .notNull(),
});
