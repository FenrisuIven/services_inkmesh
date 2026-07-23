import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { desc, eq } from 'drizzle-orm';

import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';

import { messageTable } from '../schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class MessagesRepository extends BaseRepository<typeof messageTable> {
  constructor(@Inject(DRIZZLE_CLIENT) db: NodePgDatabase) {
    super(db, messageTable);
  }

  async findRecentByRoomId(roomId: string, limit = 20) {
    return this.db
      .select()
      .from(this.table)
      .where(eq(this.table.roomId, roomId))
      .orderBy(desc(this.table.sentAt))
      .limit(limit);
  }

  async findLastMessageByRoomId(roomId: string) {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.roomId, roomId))
      .orderBy(desc(this.table.sentAt))
      .limit(1);
    return results[0];
  }
}
