import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../db/repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async findByAuth0Id(auth0Id: string) {
    return this.usersRepository.findByAuth0Id(auth0Id);
  }

  async updateMember(id: string, data: any) {
    return this.usersRepository.update(id, data);
  }

  async deleteMember(id: string) {
    return this.usersRepository.delete(id);
  }

  async assignRole(projectId: string, memberId: string, role: any) {
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
