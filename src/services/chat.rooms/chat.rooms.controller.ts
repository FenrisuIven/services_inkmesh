import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChatRoomsService } from './chat.rooms.service';
import { CHAT_MESSAGES } from '@inkmesh/contracts';

@Controller()
export class ChatRoomsController {
  constructor(private readonly chatRoomsService: ChatRoomsService) {}

  @MessagePattern({ cmd: CHAT_MESSAGES.GET_ACTIVE_ROOM })
  async getActiveRoom(@Payload() data: { projectId: string }) {
    return await this.chatRoomsService.getActiveRoom(data.projectId);
  }

  @MessagePattern({ cmd: CHAT_MESSAGES.SAVE_MESSAGE })
  async saveMessage(
    @Payload() data: { projectId: string; auth0Id: string; content: string },
  ) {
    return await this.chatRoomsService.saveMessage(data);
  }

  @MessagePattern({ cmd: 'get-chat-history' }) // Internal cmd for Gateway
  async getHistory(@Payload() data: { projectId: string }) {
    return await this.chatRoomsService.getHistory(data.projectId);
  }

  @MessagePattern({ cmd: CHAT_MESSAGES.GET_ARCHIVED_ROOMS })
  async getArchivedRooms(
    @Payload() data: { projectId: string; auth0Id: string },
  ) {
    return await this.chatRoomsService.getArchivedRooms(
      data.projectId,
      data.auth0Id,
    );
  }

  @MessagePattern({ cmd: CHAT_MESSAGES.DELETE_ARCHIVED_ROOM })
  async deleteArchivedRoom(
    @Payload() data: { roomId: string; auth0Id: string },
  ) {
    return await this.chatRoomsService.deleteArchivedRoom(
      data.roomId,
      data.auth0Id,
    );
  }
}
