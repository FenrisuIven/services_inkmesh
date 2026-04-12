import * as p from 'drizzle-orm/pg-core';

import { chatsSchema } from './chats.schema';

export const chatRoomTable = chatsSchema.table('chat_rooms', {
  id: p.uuid().defaultRandom().primaryKey(),
  createdAt: p.timestamp('created_at').defaultNow(),
  expiresAt: p.timestamp('expires_at'),
  active: p.boolean().default(true),
});
