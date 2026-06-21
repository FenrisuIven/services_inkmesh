import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DraftsRepository } from '../../db/repositories/drafts.repository';
import { DraftUpdatePayload } from '@inkmesh/contracts';
import Delta from 'quill-delta';

interface DraftSession {
  content: Delta; // Changed to Delta
  isDirty: boolean;
  lastUpdatedAt: Date;
}

@Injectable()
export class DraftsMemoryService {
  private readonly logger = new Logger(DraftsMemoryService.name);
  private readonly sessions = new Map<string, DraftSession>();

  constructor(private readonly repository: DraftsRepository) {}

  async getDraftContent(projectId: string): Promise<any> {
    this.logger.log(`getDraftContent called for ${projectId}`);
    const session = this.sessions.get(projectId);
    if (session) {
      return session.content.ops;
    }

    const draftId = await this.repository.findOrCreateDraftByProjectId(projectId);
    if (!draftId) {
      throw new Error(`Failed to ensure draft for project ${projectId}`);
    }

    const contentStr = await this.repository.getDraftContent(draftId);
    // Assume stored as HTML for now, convert to Delta
    const content = new Delta([{insert: contentStr}]); 
    this.sessions.set(projectId, {
      content,
      isDirty: false,
      lastUpdatedAt: new Date(),
    });

    return content.ops;
  }

  async applyUpdate(payload: DraftUpdatePayload): Promise<void> {
    this.logger.log(`applyUpdate called for ${payload.projectId}`);
    const { projectId, delta } = payload;
    
    let session = this.sessions.get(projectId);
    if (!session) {
      await this.getDraftContent(projectId);
      session = this.sessions.get(projectId)!;
    }

    const incomingDelta = new Delta(delta);
    session.content = session.content.compose(incomingDelta);
    session.isDirty = true;
    session.lastUpdatedAt = new Date();

    this.logger.debug(`Applied update to draft ${projectId}.`);
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
          // Convert Delta to something that can be stored in DB (e.g., JSON string or keep as HTML if needed?)
          // For now, let's keep it as JSON stringified Delta
          await this.repository.saveDraftContent(draftId, JSON.stringify(session.content.ops));
          session.isDirty = false;
          this.logger.log(`Successfully flushed draft for project ${projectId}`);
        }
      } catch (error) {
        this.logger.error(`Failed to flush draft for project ${projectId}: ${error.message}`);
      }
    }
  }
}
