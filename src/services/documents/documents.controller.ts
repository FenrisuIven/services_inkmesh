import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DocumentsRepository } from '../../db/repositories/documents.repository';

@Controller()
export class DocumentsController {
  constructor(private readonly repository: DocumentsRepository) {}

  @MessagePattern({ cmd: 'get-documents' })
  async getDocuments() {
    return await this.repository.findAll();
  }
}
