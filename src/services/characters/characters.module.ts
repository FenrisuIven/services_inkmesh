import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { CharactersRepository } from '../../db/repositories/characters.repository';
import { DrizzleModule } from '../../db/drizzle/drizzle.module';
import { UsersModule } from '../users/users.module';
import { GoogleDriveService } from './google-drive.service';

@Module({
  imports: [DrizzleModule, UsersModule],
  controllers: [CharactersController],
  providers: [CharactersService, CharactersRepository, GoogleDriveService],
  exports: [CharactersService],
})
export class CharactersModule {}
