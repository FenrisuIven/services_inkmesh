import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DocumentsRepository } from '../../db/repositories/documents.repository';
import { DocumentsSessionService } from './documents-session.service';
import { DOCUMENT_MESSAGES, SyncPayload } from '@inkmesh/contracts';

@Controller()
export class DocumentsController {
  constructor(
    private readonly repository: DocumentsRepository,
    private readonly sessionService: DocumentsSessionService,
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
    return await this.repository.create(data);
  }

  @MessagePattern({ cmd: 'update-document' })
  async updateDocument(@Payload() payload: { id: string; data: any }) {
    return await this.repository.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'delete-document' })
  async deleteDocument(@Payload() id: string) {
    return await this.repository.delete(id);
  }
}
