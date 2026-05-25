import * as p from 'drizzle-orm/pg-core';

import { chatsSchema } from './chats.schema';
import { chatRoomTable } from './chat.room.table';
import { memberTable } from './member.table';

export const messageTable = chatsSchema.table('messages', {
  id: p.uuid().defaultRandom().primaryKey(),
  senderName: p.text('sender_name'),
  content: p.text().notNull(),
  sentAt: p.timestamp('sent_at').defaultNow(),
  roomId: p
    .uuid()
    .references(() => chatRoomTable.id)
    .notNull(),
  senderId: p
    .uuid('sender_id')
    .notNull()
    .references(() => memberTable.id),
});
