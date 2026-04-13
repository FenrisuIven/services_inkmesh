import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectsRepository } from '../../db/repositories/projects.repository';

@Controller()
export class ProjectsController {
  constructor(private readonly repository: ProjectsRepository) {}

  @MessagePattern({ cmd: 'get-projects' })
  async getProjects() {
    return await this.repository.findAll();
  }

  @MessagePattern({ cmd: 'get-project' })
  async getProject(@Payload() id: string) {
    return await this.repository.findById(id);
  }

  @MessagePattern({ cmd: 'create-project' })
  async createProject(@Payload() data: any) {
    return await this.repository.create(data);
  }

  @MessagePattern({ cmd: 'update-project' })
  async updateProject(@Payload() payload: { id: string; data: any }) {
    return await this.repository.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'delete-project' })
  async deleteProject(@Payload() id: string) {
    return await this.repository.delete(id);
  }
}
