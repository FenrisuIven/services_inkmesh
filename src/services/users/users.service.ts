import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UsersRepository } from '../../db/repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createMember(data: { username: string; auth0Id: string }) {
    const existing = await this.usersRepository.findByAuth0Id(data.auth0Id);
    if (existing) {
      throw new RpcException(
        'Member already exists. Please use the update method instead of create.',
      );
    }
    return this.usersRepository.create({
      username: data.username,
      auth0_id: data.auth0Id,
    });
  }

  async findByAuth0Id(auth0Id: string) {
    return this.usersRepository.findByAuth0Id(auth0Id);
  }

  async checkProjectRole(payload: { auth0_id: string; project_id: string }) {
    return this.usersRepository.isProjectMember(
      payload.auth0_id,
      payload.project_id,
    );
  }

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async updateMember(id: string, data: { username?: string }) {
    return this.usersRepository.update(id, data);
  }

  async deleteMember(id: string) {
    return this.usersRepository.delete(id);
  }

  async assignRole(
    projectId: string,
    memberId: string,
    role: 'OWNER' | 'MODERATOR' | 'WRITER',
  ) {
    return this.usersRepository.assignRole(projectId, memberId, role);
  }

  async removeRole(projectId: string, memberId: string) {
    return this.usersRepository.removeRole(projectId, memberId);
  }

  async getProjectMembers(projectId: string) {
    return this.usersRepository.getProjectMembers(projectId);
  }

  async findAll() {
    return this.usersRepository.findAll();
  }
}
