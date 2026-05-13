import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DocumentsRepository } from '../../db/repositories/documents.repository';
import { DocumentsSessionService } from './documents-session.service';
import { DOCUMENT_MESSAGES, SyncPayload } from '@inkmesh/contracts';
import { GoogleDriveService } from './google-drive.service';
import { UsersRepository } from '../../db/repositories/users.repository';

@Controller()
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly repository: DocumentsRepository,
    private readonly sessionService: DocumentsSessionService,
    private readonly driveService: GoogleDriveService,
    private readonly usersRepository: UsersRepository,
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

    // 1. Resolve internal member ID
    const member = await this.usersRepository.findByAuth0Id(auth0Id);
    if (!member) {
      throw new Error(`Member with auth0Id ${auth0Id} not found`);
    }

    const folderName = `${member.id}|${projectId}`;
    const fileName = docData.name;

    try {
      await this.driveService.createEmptyFile(folderName, fileName);
      docData.filePath = `${folderName}/${fileName}`;
    } catch (error) {
      this.logger.error(
        `Failed to create Google Drive file for document: ${error.message}`,
      );
    }

    return await this.repository.create(docData);
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
        this.logger.error(`Failed to delete Google Drive file for document ${id}: ${error.message}`);
      }
    }

    return await this.repository.delete(id);
  }
}
