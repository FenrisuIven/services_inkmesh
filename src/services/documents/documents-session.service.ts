import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  SyncPayload,
  SessionInitResponse,
  SyncResponse,
} from '@inkmesh/contracts';
import { GoogleDriveService } from './google-drive.service';
import { DocumentsRepository } from '../../db/repositories/documents.repository';

interface DocumentSession {
  docId: string;
  content: string;
  lastUpdatedAt: Date;
  isDirty: boolean;
}

@Injectable()
export class DocumentsSessionService {
  private readonly logger = new Logger(DocumentsSessionService.name);

  private readonly sessions = new Map<string, DocumentSession>();
  private readonly docIdToSessionId = new Map<string, string>();

  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly repository: DocumentsRepository,
  ) {}

  async initSession(docId: string): Promise<SessionInitResponse> {
    this.logger.log(`Initializing session for document ${docId}`);

    const existingSessionId = this.docIdToSessionId.get(docId);
    if (existingSessionId) {
      const session = this.sessions.get(existingSessionId);
      if (session) {
        return {
          sessionId: existingSessionId,
          content: session.content,
        };
      }
    }

    const document = await this.repository.findById(docId);
    if (!document) {
      throw new Error(`Document ${docId} not found`);
    }

    const content = await this.googleDriveService.getFileContent(
      document.filePath || `docs/${docId}`,
    );

    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      docId,
      content,
      lastUpdatedAt: new Date(),
      isDirty: false,
    });
    this.docIdToSessionId.set(docId, sessionId);

    return {
      sessionId,
      content,
    };
  }

  async syncDocument(
    docId: string,
    payload: SyncPayload,
  ): Promise<SyncResponse> {
    const session = this.sessions.get(payload.sessionId);

    if (!session || session.docId !== docId) {
      this.logger.warn(
        `Invalid session ${payload.sessionId} for document ${docId}`,
      );
      return { success: false, message: 'Invalid session' };
    }

    const { startIndex, endIndex, content: newRangeContent } = payload;

    const currentContent = session.content;
    const updatedContent =
      currentContent.substring(0, startIndex) +
      newRangeContent +
      currentContent.substring(endIndex);

    session.content = updatedContent;
    session.lastUpdatedAt = new Date();
    session.isDirty = true;

    this.logger.debug(
      `Applied sync for session ${payload.sessionId}. New length: ${updatedContent.length}`,
    );

    return { success: true };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  handleAutoSave() {
    const dirtySessions = Array.from(this.sessions.values()).filter(
      (s) => s.isDirty,
    );
    if (dirtySessions.length > 0) {
      this.logger.log(
        `Auto-save: ${dirtySessions.length} sessions are currently dirty.`,
      );
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async flushToCloudStorage() {
    this.logger.log('Flushing dirty sessions to Google Drive...');

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.isDirty) {
        try {
          const document = await this.repository.findById(session.docId);
          if (document) {
            await this.googleDriveService.uploadFileContent(
              document.filePath || `docs/${session.docId}`,
              session.content,
            );
            session.isDirty = false;
            this.logger.log(
              `Successfully flushed session ${sessionId} for document ${session.docId}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to flush session ${sessionId}: ${error.message}`,
          );
        }
      }
    }

    this.logger.log('Dirty sessions flushed to Google Drive');
  }
}
