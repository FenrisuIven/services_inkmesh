import { Module } from '@nestjs/common';
import { DraftsRepository } from '../../db/repositories/drafts.repository';
import { DraftsController } from './drafts.controller';
import { DrizzleModule } from '../../db/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [DraftsController],
  providers: [DraftsRepository],
})
export class DraftsModule {}
