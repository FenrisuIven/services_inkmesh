import { BaseRepository } from './base.repository';
import { documentTable } from '../schema/document.table';
import { projectToDocumentsTable } from '../schema/projects.to.documents.table';
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

@Injectable()
export class DocumentsRepository extends BaseRepository<typeof documentTable> {
  constructor(@Inject(DRIZZLE_CLIENT) db: NodePgDatabase) {
    super(db, documentTable);
  }

  async create(data: any, projectId?: string) {
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
