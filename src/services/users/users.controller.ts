import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

export interface CreateMemberDto {
  username: string;
  auth0Id: string;
}

export interface UpdateMemberDto {
  username?: string;
}

export interface AssignRoleDto {
  projectId: string;
  memberId: string;
  role: 'OWNER' | 'MODERATOR' | 'WRITER';
}

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'create-member' })
  async createMember(@Payload() data: CreateMemberDto) {
    return this.usersService.createMember(data);
  }

  @MessagePattern({ cmd: 'find-by-auth0-id' })
  async findByAuth0Id(@Payload() auth0Id: string) {
    return this.usersService.findByAuth0Id(auth0Id);
  }

  @MessagePattern({ cmd: 'get-members' })
  async getMembers() {
    return this.usersService.findAll();
  }

  @MessagePattern({ cmd: 'get-member' })
  async getMember(@Payload() id: string) {
    return this.usersService.findById(id);
  }

  @MessagePattern({ cmd: 'update-member' })
  async updateMember(
    @Payload() payload: { id: string; data: UpdateMemberDto },
  ) {
    return this.usersService.updateMember(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'delete-member' })
  async deleteMember(@Payload() id: string) {
    return this.usersService.deleteMember(id);
  }

  @MessagePattern({ cmd: 'assign-role' })
  async assignRole(@Payload() payload: AssignRoleDto) {
    return this.usersService.assignRole(
      payload.projectId,
      payload.memberId,
      payload.role,
    );
  }

  @MessagePattern({ cmd: 'remove-role' })
  async removeRole(
    @Payload() payload: { projectId: string; memberId: string },
  ) {
    return this.usersService.removeRole(payload.projectId, payload.memberId);
  }

  @MessagePattern({ cmd: 'get-project-members' })
  async getProjectMembers(@Payload() projectId: string) {
    return this.usersService.getProjectMembers(projectId);
  }

  @MessagePattern({ cmd: 'check-project-role' })
  async checkProjectRole(
    @Payload() payload: { auth0_id: string; project_id: string },
  ) {
    console.log(`[Users Controller] Received check-project-role request:`, payload);
    return this.usersService.checkProjectRole(payload);
  }
}
