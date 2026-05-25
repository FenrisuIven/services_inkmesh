import { Module } from '@nestjs/common';
import { DraftsRepository } from '../../db/repositories/drafts.repository';
import { DraftsController } from './drafts.controller';
import { DrizzleModule } from '../../db/drizzle/drizzle.module';
import { DraftsMemoryService } from './drafts.memory.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersRepository } from '../../db/repositories/users.repository';

@Module({
  imports: [DrizzleModule, ScheduleModule.forRoot()],
  controllers: [DraftsController],
  providers: [DraftsRepository, DraftsMemoryService, UsersRepository],
  exports: [DraftsRepository],
})
export class DraftsModule {}
