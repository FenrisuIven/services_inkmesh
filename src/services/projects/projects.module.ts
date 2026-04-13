import { Module } from '@nestjs/common';
import { ProjectsRepository } from '../../db/repositories/projects.repository';
import { ProjectsController } from './projects.controller';
import { DrizzleModule } from '../../db/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ProjectsController],
  providers: [ProjectsRepository],
})
export class ProjectsModule {}
