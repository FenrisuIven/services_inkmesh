import { Module } from '@nestjs/common';
import { ChatRoomsService } from './chat.rooms.service';
import { ChatRoomsController } from './chat.rooms.controller';
import { ChatRoomsRepository } from '../../db/repositories/chat.rooms.repository';
import { MessagesRepository } from '../../db/repositories/messages.repository';
import { ProjectsRepository } from '../../db/repositories/projects.repository';
import { UsersRepository } from '../../db/repositories/users.repository';
import { DrizzleModule } from '../../db/drizzle/drizzle.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DrizzleModule,
  ],
  controllers: [ChatRoomsController],
  providers: [
    ChatRoomsService,
    ChatRoomsRepository,
    MessagesRepository,
    ProjectsRepository,
    UsersRepository,
  ],
})
export class ChatRoomsModule {}
