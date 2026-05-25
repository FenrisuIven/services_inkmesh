import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DraftsRepository } from '../../db/repositories/drafts.repository';
import { DraftUpdatePayload } from '@inkmesh/contracts';

interface DraftSession {
  content: string;
  isDirty: boolean;
  lastUpdatedAt: Date;
}

@Injectable()
export class DraftsMemoryService {
  private readonly logger = new Logger(DraftsMemoryService.name);
  private readonly sessions = new Map<string, DraftSession>();

  constructor(private readonly repository: DraftsRepository) {}

  async getDraftContent(projectId: string): Promise<string> {
    const session = this.sessions.get(projectId);
    if (session) {
      return session.content;
    }

    const draftId = await this.repository.findOrCreateDraftByProjectId(projectId);
    if (!draftId) {
      throw new Error(`Failed to ensure draft for project ${projectId}`);
    }

    const content = await this.repository.getDraftContent(draftId);
    this.sessions.set(projectId, {
      content,
      isDirty: false,
      lastUpdatedAt: new Date(),
    });

    return content;
  }

  async applyUpdate(payload: DraftUpdatePayload): Promise<void> {
    const { projectId, startIndex, endIndex, content: newRangeContent } = payload;
    
    let session = this.sessions.get(projectId);
    if (!session) {
      await this.getDraftContent(projectId);
      session = this.sessions.get(projectId)!;
    }

    const currentContent = session.content;
    const updatedContent =
      currentContent.substring(0, startIndex) +
      newRangeContent +
      currentContent.substring(endIndex);

    session.content = updatedContent;
    session.isDirty = true;
    session.lastUpdatedAt = new Date();

    this.logger.debug(`Applied update to draft ${projectId}. New length: ${updatedContent.length}`);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async flushToDb() {
    const dirtySessions = Array.from(this.sessions.entries()).filter(
      ([_, session]) => session.isDirty,
    );

    if (dirtySessions.length === 0) return;

    this.logger.log(`Flushing ${dirtySessions.length} dirty drafts to database...`);

    for (const [projectId, session] of dirtySessions) {
      try {
        const draftId = await this.repository.findByProjectId(projectId);
        if (draftId) {
          await this.repository.saveDraftContent(draftId, session.content);
          session.isDirty = false;
          this.logger.log(`Successfully flushed draft for project ${projectId}`);
        }
      } catch (error) {
        this.logger.error(`Failed to flush draft for project ${projectId}: ${error.message}`);
      }
    }
  }
}
