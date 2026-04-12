import { BaseRepository } from './base.repository';
import { documentTable } from '../schema/document.table';
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DocumentsRepository extends BaseRepository<typeof documentTable> {
  constructor(@Inject(DRIZZLE_CLIENT) db: NodePgDatabase) {
    super(db, documentTable);
  }
}
