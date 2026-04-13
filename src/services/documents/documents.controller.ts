import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DocumentsRepository } from '../../db/repositories/documents.repository';

@Controller()
export class DocumentsController {
  constructor(private readonly repository: DocumentsRepository) {}

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
