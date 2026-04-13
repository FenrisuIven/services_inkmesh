import { Module } from '@nestjs/common';
import { DocumentsRepository } from '../../db/repositories/documents.repository';
import { DocumentsController } from './documents.controller';
import { DrizzleModule } from '../../db/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [DocumentsController],
  providers: [DocumentsRepository],
})
export class DocumentsModule {}
