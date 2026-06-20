import { Module } from '@nestjs/common';
import { ProjectsRepository } from '../../db/repositories/projects.repository';
import { ProjectsController } from './projects.controller';
import { DrizzleModule } from '../../db/drizzle/drizzle.module';
import { GoogleDriveService } from './google-drive.service';
import { UsersModule } from '../users/users.module';
import { DraftsRepository } from '../../db/repositories/drafts.repository';

@Module({
  imports: [DrizzleModule, UsersModule],
  controllers: [ProjectsController],
  providers: [ProjectsRepository, GoogleDriveService, DraftsRepository],
  exports: [ProjectsRepository, DraftsRepository],
})
export class ProjectsModule {}
