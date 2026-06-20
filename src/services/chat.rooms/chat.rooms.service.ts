import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatRoomsRepository } from '../../db/repositories/chat.rooms.repository';
import { MessagesRepository } from '../../db/repositories/messages.repository';
import { ProjectsRepository } from '../../db/repositories/projects.repository';
import { UsersRepository } from '../../db/repositories/users.repository';

@Injectable()
export class ChatRoomsService {
  private readonly logger = new Logger(ChatRoomsService.name);

  constructor(
    private readonly chatRoomsRepo: ChatRoomsRepository,
    private readonly messagesRepo: MessagesRepository,
    private readonly projectsRepo: ProjectsRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async getActiveRoom(projectId: string) {
    let room = await this.chatRoomsRepo.findActiveByProjectId(projectId);
    if (!room) {
      room = await this.chatRoomsRepo.create({ projectId, active: true });
    }
    return room;
  }

  async saveMessage(data: {
    projectId: string;
    auth0Id: string;
    content: string;
  }) {
    const room = await this.getActiveRoom(data.projectId);
    const user = await this.usersRepo.findByAuth0Id(data.auth0Id);

    if (!user) {
      throw new Error('User not found');
    }

    return await this.messagesRepo.create({
      roomId: room.id,
      senderId: user.id,
      senderName: user.username,
      content: data.content,
    });
  }

  async getHistory(projectId: string) {
    const room = await this.getActiveRoom(projectId);
    const messages = await this.messagesRepo.findRecentByRoomId(room.id);
    return messages.reverse(); // Return in chronological order
  }

  async getArchivedRooms(projectId: string, auth0Id: string) {
    await this.verifyOwner(projectId, auth0Id);
    return await this.chatRoomsRepo.findArchivedByProjectId(projectId);
  }

  async deleteArchivedRoom(roomId: string, auth0Id: string) {
    const room = await this.chatRoomsRepo.findById(roomId);
    if (!room) throw new Error('Room not found');
    
    await this.verifyOwner(room.projectId, auth0Id);
    return await this.chatRoomsRepo.delete(roomId);
  }

  private async verifyOwner(projectId: string, auth0Id: string) {
    const user = await this.usersRepo.findByAuth0Id(auth0Id);
    if (!user) throw new Error('User not found');

    const ownerId = await this.projectsRepo.getOwnerId(projectId);
    if (ownerId !== user.id) {
      throw new Error('Unauthorized: Only the project Owner can perform this action');
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoArchive() {
    const activeRooms = await this.chatRoomsRepo.findAllActive();
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    for (const room of activeRooms) {
      const lastMessage = await this.messagesRepo.findLastMessageByRoomId(room.id);
      
      // Archive if:
      // 1. Room has messages AND last message is older than 15 mins
      // 2. Room is empty AND was created more than 15 mins ago
      const lastActivity = lastMessage ? lastMessage.sentAt : room.createdAt;
      
      if (lastActivity && lastActivity < fifteenMinutesAgo) {
        this.logger.log(`Archiving chat room ${room.id} due to inactivity`);
        await this.chatRoomsRepo.update(room.id, {
          active: false,
          expiresAt: now,
        });
      }
    }
  }
}
