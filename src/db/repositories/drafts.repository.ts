import { BaseRepository } from './base.repository';
import { draftTable } from '../schema/draft.table';
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DraftsRepository extends BaseRepository<typeof draftTable> {
  constructor(@Inject(DRIZZLE_CLIENT) db: NodePgDatabase) {
    super(db, draftTable);
  }
}
