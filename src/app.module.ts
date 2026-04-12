import { Module } from '@nestjs/common';
import { DrizzleModule } from './db/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
