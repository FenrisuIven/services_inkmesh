import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DraftsRepository } from '../../db/repositories/drafts.repository';
import { DraftsMemoryService } from './drafts.memory.service';
import { UsersRepository } from '../../db/repositories/users.repository';
import { DRAFT_MESSAGES, DraftUpdatePayload } from '@inkmesh/contracts';

@Controller()
export class DraftsController {
  constructor(
    private readonly repository: DraftsRepository,
    private readonly memoryService: DraftsMemoryService,
    private readonly usersRepository: UsersRepository,
  ) {}

  @MessagePattern({ cmd: 'verify-draft-access' })
  async verifyAccess(@Payload() payload: { projectId: string; auth0Id: string }) {
    const isMember = await this.usersRepository.isProjectMember(payload.auth0Id, payload.projectId);
    return { isMember };
  }

  @MessagePattern({ cmd: DRAFT_MESSAGES.GET_CONTENT })
  async getDraftContent(@Payload() payload: { projectId: string; auth0Id: string }) {
    const isMember = await this.usersRepository.isProjectMember(payload.auth0Id, payload.projectId);
    if (!isMember) {
      throw new Error('Unauthorized: Not a project member');
    }
    return await this.memoryService.getDraftContent(payload.projectId);
  }

  @MessagePattern({ cmd: DRAFT_MESSAGES.UPDATE_MEMORY })
  async updateDraftMemory(@Payload() payload: DraftUpdatePayload & { auth0Id: string }) {
    const isMember = await this.usersRepository.isProjectMember(payload.auth0Id, payload.projectId);
    if (!isMember) {
      throw new Error('Unauthorized: Not a project member');
    }
    await this.memoryService.applyUpdate(payload);
    return { success: true };
  }

  @MessagePattern({ cmd: DRAFT_MESSAGES.RESET })
  async resetDraft(@Payload() payload: { projectId: string; auth0Id: string }) {
    const { projectId, auth0Id } = payload;
    const role = await this.usersRepository.getProjectRole(auth0Id, projectId);
    
    if (role !== 'OWNER') {
      return { success: false, message: 'Only project owners can reset the draft' };
    }

    const draftId = await this.repository.findByProjectId(projectId);
    if (draftId) {
      await this.repository.saveDraftContent(draftId, '');
      // Note: In-memory session will be updated on next flush or we could clear it here
      return { success: true };
    }
    return { success: false, message: 'Draft not found' };
  }

  @MessagePattern({ cmd: 'create-draft' })
  async createDraft(@Payload() data: any) {
    return await this.repository.create(data);
  }

  @MessagePattern({ cmd: 'get-drafts' })
  async getDrafts() {
    return await this.repository.findAll();
  }
}
