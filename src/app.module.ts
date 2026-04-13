import { Module } from '@nestjs/common';
import { DrizzleModule } from './db/drizzle/drizzle.module';
import { DocumentsModule } from './services/documents/documents.module';
import { ProjectsModule } from './services/projects/projects.module';

@Module({
  imports: [DrizzleModule, DocumentsModule, ProjectsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
