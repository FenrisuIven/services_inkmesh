import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DocumentsRepository } from '../../db/repositories/documents.repository';
import { DocumentsSessionService } from './documents-session.service';
import { DOCUMENT_MESSAGES, SyncPayload } from '@inkmesh/contracts';
import { GoogleDriveService } from './google-drive.service';
import { ProjectsRepository } from '../../db/repositories/projects.repository';

@Controller()
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly repository: DocumentsRepository,
    private readonly projectsRepo: ProjectsRepository,
    private readonly sessionService: DocumentsSessionService,
    private readonly driveService: GoogleDriveService,
  ) {}

  @MessagePattern({ cmd: DOCUMENT_MESSAGES.INIT_SESSION })
  async initSession(@Payload() data: { docId: string }) {
    return await this.sessionService.initSession(data.docId);
  }

  @MessagePattern({ cmd: DOCUMENT_MESSAGES.SYNC })
  async syncDocument(@Payload() data: SyncPayload & { docId: string }) {
    const { docId, ...payload } = data;
    return await this.sessionService.syncDocument(docId, payload);
  }

  @MessagePattern({ cmd: 'get-documents' })
  async getDocuments() {
    return await this.repository.findAll();
  }

  @MessagePattern({ cmd: 'get-document' })
  async getDocument(@Payload() id: string) {
    return await this.repository.findById(id);
  }

  @MessagePattern({ cmd: 'create-document' })
  async createDocument(@Payload() data: any) {
    const { ownerId: auth0Id, projectId, ...docData } = data;

    const ownerId = await this.projectsRepo.getOwnerId(projectId);
    if (!ownerId) {
      throw new Error('Project owner not found');
    }

    const folderName = `${ownerId}|${projectId}`;
    const fileName = docData.name;

    try {
      await this.driveService.createEmptyFile(folderName, fileName);
      docData.filePath = `${folderName}/${fileName}`;
    } catch (error: any) {
      this.logger.error(
        `Failed to create Google Drive file for document: ${error.message}`,
      );
    }

    return await this.repository.create(docData, projectId);
  }

  @MessagePattern({ cmd: 'get-project-documents' })
  async getProjectDocuments(@Payload() projectId: string) {
    return await this.repository.findByProjectId(projectId);
  }

  @MessagePattern({ cmd: 'update-document' })
  async updateDocument(@Payload() payload: { id: string; data: any }) {
    return await this.repository.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'delete-document' })
  async deleteDocument(@Payload() id: string) {
    const document = await this.repository.findById(id);
    if (document && document.filePath) {
      const [folderName, fileName] = document.filePath.split('/');
      try {
        await this.driveService.deleteFile(folderName, fileName);
      } catch (error) {
        this.logger.error(
          `Failed to delete Google Drive file for document ${id}: ${error.message}`,
        );
      }
    }

    return await this.repository.delete(id);
  }
}
