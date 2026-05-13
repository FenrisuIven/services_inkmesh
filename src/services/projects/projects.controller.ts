import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectsRepository } from '../../db/repositories/projects.repository';
import { GoogleDriveService } from './google-drive.service';
import { UsersRepository } from '../../db/repositories/users.repository';

@Controller()
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(
    private readonly repository: ProjectsRepository,
    private readonly driveService: GoogleDriveService,
    private readonly usersRepository: UsersRepository,
  ) {}

  @MessagePattern({ cmd: 'get-projects' })
  async getProjects() {
    return await this.repository.findAll();
  }

  @MessagePattern({ cmd: 'get-my-projects' })
  async getMyProjects(@Payload() auth0Id: string) {
    return await this.repository.findByAuth0Id(auth0Id);
  }

  @MessagePattern({ cmd: 'get-project' })
  async getProject(@Payload() id: string) {
    return await this.repository.findById(id);
  }

  @MessagePattern({ cmd: 'create-project' })
  async createProject(@Payload() data: any) {
    const { ownerId: auth0Id, ...projectData } = data;

    // 1. Get internal memberId from auth0Id
    const member = await this.usersRepository.findByAuth0Id(auth0Id);
    if (!member) {
      throw new Error(`Member with auth0Id ${auth0Id} not found`);
    }

    // 2. Create the project
    const project = await this.repository.create(projectData);

    if (project) {
      try {
        // 3. Link the user to the project as OWNER
        await this.usersRepository.assignRole(project.id, member.id, 'OWNER');

        // 4. Create Google Drive folder using internal IDs
        await this.driveService.createProjectFolder(member.id, project.id);
      } catch (error) {
        this.logger.error(
          `Failed to complete project setup (role/folder) for ${project.id}: ${error.message}`,
        );
      }
    }

    return project;
  }

  @MessagePattern({ cmd: 'update-project' })
  async updateProject(@Payload() payload: { id: string; data: any }) {
    return await this.repository.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'delete-project' })
  async deleteProject(@Payload() id: string) {
    const ownerId = await this.repository.getOwnerId(id);
    if (ownerId) {
      try {
        const folderName = `${ownerId}|${id}`;
        await this.driveService.deleteProjectFolder(folderName);
      } catch (error) {
        this.logger.error(`Failed to delete Google Drive folder for project ${id}: ${error.message}`);
      }
    }

    return await this.repository.delete(id);
  }

  @MessagePattern({ cmd: 'add-project-member' })
  async addProjectMember(@Payload() payload: { projectId: string; memberId: string; role: 'OWNER' | 'MODERATOR' | 'WRITER' }) {
    return this.usersRepository.assignRole(payload.projectId, payload.memberId, payload.role);
  }

  @MessagePattern({ cmd: 'get-project-members' })
  async getProjectMembers(@Payload() projectId: string) {
    return this.usersRepository.getProjectMembers(projectId);
  }
}
