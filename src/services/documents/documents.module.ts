import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DocumentsRepository } from '../../db/repositories/documents.repository';
import { DocumentsController } from './documents.controller';
import { DrizzleModule } from '../../db/drizzle/drizzle.module';
import { DocumentsSessionService } from './documents-session.service';
import { GoogleDriveService } from './google-drive.service';
import { ProjectsRepository } from '../../db/repositories/projects.repository';

@Module({
  imports: [DrizzleModule, ScheduleModule.forRoot()],
  controllers: [DocumentsController],
  providers: [
    DocumentsRepository,
    ProjectsRepository,
    DocumentsSessionService,
    GoogleDriveService,
  ],
})
export class DocumentsModule {}
