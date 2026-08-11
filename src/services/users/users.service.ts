import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UsersRepository } from '../../db/repositories/users.repository';
import type {
  CreateMemberDto,
  MemberDto,
  ProjectMemberDto,
} from '@inkmesh/contracts';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createMember(data: CreateMemberDto): Promise<MemberDto> {
    const existing = await this.usersRepository.findByAuth0Id(data.auth0_id);
    if (existing) {
      throw new RpcException(
        'Member already exists. Please use the update method instead of create.',
      );
    }
    return this.usersRepository.create({
      username: data.username,
      auth0_id: data.auth0_id,
    });
  }

  async findByAuth0Id(auth0Id: string): Promise<MemberDto> {
    return this.usersRepository.findByAuth0Id(auth0Id);
  }

  async checkProjectRole(auth0Id: string, projectId: string): Promise<boolean> {
    return this.usersRepository.isProjectMember(auth0Id, projectId);
  }

  async getProjectRole(auth0Id: string, projectId: string): Promise<string> {
    return this.usersRepository.getProjectRole(auth0Id, projectId);
  }

  async findById(id: string): Promise<MemberDto | undefined> {
    return this.usersRepository.findById(id);
  }

  async updateMember(
    id: string,
    data: { username?: string },
  ): Promise<MemberDto | undefined> {
    return this.usersRepository.update(id, data);
  }

  async deleteMember(id: string): Promise<boolean> {
    return this.usersRepository.delete(id);
  }

  async assignRole(
    projectId: string,
    memberId: string,
    role: 'OWNER' | 'MODERATOR' | 'WRITER',
  ): Promise<ProjectMemberDto[]> {
    return this.usersRepository.assignRole(projectId, memberId, role);
  }

  async removeRole(
    projectId: string,
    memberId: string,
  ): Promise<ProjectMemberDto[]> {
    return this.usersRepository.removeRole(projectId, memberId);
  }

  async getProjectMembers(projectId: string): Promise<MemberDto[]> {
    return this.usersRepository.getProjectMembers(projectId);
  }

  async findAllUsers(): Promise<MemberDto[]> {
    return this.usersRepository.findAllUsers();
  }

  async findAll(): Promise<MemberDto[]> {
    return this.usersRepository.findAll();
  }
}
