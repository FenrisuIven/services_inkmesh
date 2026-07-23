import { Inject, Injectable } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';

import { documentTable, projectToDocumentsTable } from '../schema';
import { BaseRepository } from './base.repository';

// TODO: Move to contracts
interface Document {
  id: string;
  name: string;
  periodStart: string | null;
  periodEnd: string | null;
  filePath: string | null;
  beforeDocId: string | null;
  afterDocId: string | null;
}

type CreateDocumentDto = Omit<Document, 'id'>;

@Injectable()
export class DocumentsRepository extends BaseRepository<typeof documentTable> {
  constructor(@Inject(DRIZZLE_CLIENT) db: NodePgDatabase) {
    super(db, documentTable);
  }

  async create(data: CreateDocumentDto, projectId?: string) {
    const document = await super.create(data);

    if (projectId) {
      await this.db
        .insert(projectToDocumentsTable)
        .values({ projectId, documentId: document.id });
    }

    return document;
  }

  async findByProjectId(projectId: string) {
    return this.db
      .select({
        id: documentTable.id,
        name: documentTable.name,
        filePath: documentTable.filePath,
        periodStart: documentTable.periodStart,
        periodEnd: documentTable.periodEnd,
        beforeDocId: documentTable.beforeDocId,
        afterDocId: documentTable.afterDocId,
      })
      .from(documentTable)
      .innerJoin(
        projectToDocumentsTable,
        eq(documentTable.id, projectToDocumentsTable.documentId),
      )
      .where(eq(projectToDocumentsTable.projectId, projectId));
  }
}
