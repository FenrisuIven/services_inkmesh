import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseRepository } from './base.repository';
import { chatRoomTable } from '../schema/chat.room.table';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class ChatRoomsRepository extends BaseRepository<typeof chatRoomTable> {
  constructor(@Inject(DRIZZLE_CLIENT) db: NodePgDatabase) {
    super(db, chatRoomTable);
  }

  async findActiveByProjectId(projectId: string) {
    const results = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.projectId, projectId), eq(this.table.active, true)));
    return results[0];
  }

  async findArchivedByProjectId(projectId: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.projectId, projectId), eq(this.table.active, false)));
  }

  async findAllActive() {
    return await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.active, true));
  }
}
