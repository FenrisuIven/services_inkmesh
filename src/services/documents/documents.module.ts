import { Module } from '@nestjs/common';
import { DocumentsRepository } from '../../db/repositories/documents.repository';
import { DocumentsController } from './documents.controller';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsRepository],
})
export class DocumentsModule {}
