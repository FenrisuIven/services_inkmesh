import { BaseRepository } from './base.repository';
import { draftTable } from '../schema/draft.table';
import { draftChunkTable } from '../schema/draft.chunk.table';
import { projectTable } from '../schema/project.table';
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, asc } from 'drizzle-orm';

@Injectable()
export class DraftsRepository extends BaseRepository<typeof draftTable> {
  constructor(@Inject(DRIZZLE_CLIENT) db: NodePgDatabase) {
    super(db, draftTable);
  }

  async findByProjectId(projectId: string) {
    const results = await this.db
      .select({ draftId: projectTable.draftId })
      .from(projectTable)
      .where(eq(projectTable.id, projectId));

    return results[0]?.draftId;
  }

  async findOrCreateDraftByProjectId(projectId: string) {
    const draftId = await this.findByProjectId(projectId);
    if (draftId) return draftId;

    // Create new draft
    const draft = await this.create({});
    if (!draft) throw new Error('Failed to create draft');

    // Link to project
    await this.db
      .update(projectTable)
      .set({ draftId: draft.id })
      .where(eq(projectTable.id, projectId));

    return draft.id;
  }

  async getDraftContent(draftId: string): Promise<string> {
    const chunks = await this.db
      .select()
      .from(draftChunkTable)
      .where(eq(draftChunkTable.draftId, draftId))
      .orderBy(asc(draftChunkTable.order));

    return chunks.map((c) => c.content).join('\n');
  }

  async saveDraftContent(draftId: string, content: string): Promise<void> {
    const lines = content.split('\n');
    
    await this.db.transaction(async (tx) => {
      // 1. Delete existing chunks
      await tx.delete(draftChunkTable).where(eq(draftChunkTable.draftId, draftId));

      // 2. Insert new chunks in order
      if (lines.length > 0) {
        await tx.insert(draftChunkTable).values(
          lines.map((line, index) => ({
            draftId,
            content: line,
            order: index,
          })),
        );
      }
    });
  }
}
