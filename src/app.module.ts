import { Module } from '@nestjs/common';
import { DrizzleModule } from './db/drizzle/drizzle.module';
import { DocumentsModule } from './services/documents/documents.module';

@Module({
  imports: [DrizzleModule, DocumentsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
