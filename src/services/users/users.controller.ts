import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import type {
  CreateMemberPayload,
  FindMemberByAuth0IdPayload,
  GetMemberPayload,
  MemberDto,
  ProjectMemberDto,
  UpdateMemberPayload,
  AssignRolePayload,
  RemoveRolePayload,
  GetProjectMembersPayload,
  CheckProjectRolePayload,
} from '@inkmesh/contracts';
import { MEMBER_MESSAGES } from '@inkmesh/contracts';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(MEMBER_MESSAGES.CREATE_MEMBER)
  async createMember(
    @Payload() payload: CreateMemberPayload,
  ): Promise<MemberDto> {
    return this.usersService.createMember(payload.data);
  }

  @MessagePattern(MEMBER_MESSAGES.FIND_BY_AUTH0_ID)
  async findByAuth0Id(
    @Payload() payload: FindMemberByAuth0IdPayload,
  ): Promise<MemberDto> {
    return this.usersService.findByAuth0Id(payload.auth0Id);
  }

  @MessagePattern(MEMBER_MESSAGES.GET_ALL)
  async getAllUsers(): Promise<MemberDto[]> {
    return this.usersService.findAllUsers();
  }

  @MessagePattern(MEMBER_MESSAGES.GET_MEMBERS)
  async getMembers(): Promise<MemberDto[]> {
    return this.usersService.findAll();
  }

  @MessagePattern(MEMBER_MESSAGES.GET_MEMBER)
  async getMember(
    @Payload() payload: GetMemberPayload,
  ): Promise<MemberDto | undefined> {
    return this.usersService.findById(payload.id);
  }

  @MessagePattern(MEMBER_MESSAGES.UPDATE_MEMBER)
  async updateMember(
    @Payload() payload: UpdateMemberPayload,
  ): Promise<MemberDto | undefined> {
    return this.usersService.updateMember(payload.id, payload.data);
  }

  @MessagePattern(MEMBER_MESSAGES.DELETE_MEMBER)
  async deleteMember(@Payload() id: string): Promise<boolean> {
    return this.usersService.deleteMember(id);
  }

  @MessagePattern(MEMBER_MESSAGES.ASSIGN_ROLE)
  async assignRole(
    @Payload() payload: AssignRolePayload,
  ): Promise<ProjectMemberDto[]> {
    return this.usersService.assignRole(
      payload.projectId,
      payload.memberId,
      payload.role,
    );
  }

  @MessagePattern(MEMBER_MESSAGES.REMOVE_ROLE)
  async removeRole(
    @Payload() payload: RemoveRolePayload,
  ): Promise<ProjectMemberDto[]> {
    return this.usersService.removeRole(payload.projectId, payload.memberId);
  }

  @MessagePattern(MEMBER_MESSAGES.GET_PROJECT_MEMBERS)
  async getProjectMembers(
    @Payload() payload: GetProjectMembersPayload,
  ): Promise<MemberDto[]> {
    return this.usersService.getProjectMembers(payload.projectId);
  }

  @MessagePattern(MEMBER_MESSAGES.CHECK_PROJECT_ROLE)
  async checkProjectRole(
    @Payload() payload: CheckProjectRolePayload,
  ): Promise<boolean> {
    return this.usersService.checkProjectRole(
      payload.auth0_id,
      payload.project_id,
    );
  }
}
