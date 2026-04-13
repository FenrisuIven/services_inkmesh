import { Module } from '@nestjs/common';
import { ProjectsRepository } from '../../db/repositories/projects.repository';
import { ProjectsController } from './projects.controller';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsRepository],
})
export class ProjectsModule {}
