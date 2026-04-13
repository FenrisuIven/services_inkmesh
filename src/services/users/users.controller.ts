import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'get-members' })
  async getMembers() {
    return this.usersService.findAll();
  }

  @MessagePattern({ cmd: 'get-member' })
  async getMember(@Payload() id: string) {
    return this.usersService.findById(id);
  }

  @MessagePattern({ cmd: 'update-member' })
  async updateMember(@Payload() payload: { id: string; data: any }) {
    return this.usersService.updateMember(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'delete-member' })
  async deleteMember(@Payload() id: string) {
    return this.usersService.deleteMember(id);
  }

  @MessagePattern({ cmd: 'assign-role' })
  async assignRole(
    @Payload() payload: { projectId: string; memberId: string; role: any },
  ) {
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
}
