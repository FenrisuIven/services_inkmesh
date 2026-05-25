import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ProjectsRepository } from '../../db/repositories/projects.repository';
import { GoogleDriveService } from './google-drive.service';
import { UsersRepository } from '../../db/repositories/users.repository';
import { DraftsRepository } from '../../db/repositories/drafts.repository';
import { PROJECT_MESSAGES } from '@inkmesh/contracts';

@Controller()
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(
    private readonly repository: ProjectsRepository,
    private readonly driveService: GoogleDriveService,
    private readonly usersRepository: UsersRepository,
    private readonly draftsRepository: DraftsRepository,
  ) {}

  @MessagePattern(PROJECT_MESSAGES.GET_ALL)
  async getProjects() {
    return await this.repository.findAll();
  }

  @MessagePattern(PROJECT_MESSAGES.GET_MY)
  async getMyProjects(@Payload() auth0Id: string) {
    return await this.repository.findByAuth0Id(auth0Id);
  }

  @MessagePattern(PROJECT_MESSAGES.GET_ONE)
  async getProject(@Payload() id: string) {
    return await this.repository.findById(id);
  }

  @MessagePattern(PROJECT_MESSAGES.CREATE)
  async createProject(@Payload() data: any) {
    const { ownerId: auth0Id, ...projectData } = data;

    const member = await this.usersRepository.findByAuth0Id(auth0Id);
    if (!member) {
      throw new Error(`Member with auth0Id ${auth0Id} not found`);
    }

    const draft = await this.draftsRepository.create({});
    if (!draft) {
      throw new Error('Failed to create draft for project');
    }

    const project = await this.repository.create({
      ...projectData,
      draftId: draft.id,
    });

    if (project) {
      try {
        await this.usersRepository.assignRole(project.id, member.id, 'OWNER');

        await this.driveService.createProjectFolder(member.id, project.id);
      } catch (error) {
        this.logger.error(
          `Failed to complete project setup (role/folder) for ${project.id}: ${error.message}`,
        );
      }
    }

    return project;
  }

  @MessagePattern(PROJECT_MESSAGES.UPDATE)
  async updateProject(@Payload() payload: { id: string; data: any }) {
    return await this.repository.update(payload.id, payload.data);
  }

  @MessagePattern(PROJECT_MESSAGES.DELETE)
  async deleteProject(@Payload() id: string) {
    const ownerId = await this.repository.getOwnerId(id);
    if (ownerId) {
      try {
        const folderName = `${ownerId}|${id}`;
        await this.driveService.deleteProjectFolder(folderName);
      } catch (error) {
        this.logger.error(
          `Failed to delete Google Drive folder for project ${id}: ${error.message}`,
        );
      }
    }

    return await this.repository.delete(id);
  }

  @MessagePattern(PROJECT_MESSAGES.ADD_MEMBER)
  async addProjectMember(
    @Payload()
    payload: {
      projectId: string;
      memberId: string;
      role: 'OWNER' | 'MODERATOR' | 'WRITER';
    },
  ) {
    return this.usersRepository.assignRole(
      payload.projectId,
      payload.memberId,
      payload.role,
    );
  }

  @MessagePattern(PROJECT_MESSAGES.GET_MEMBERS)
  async getProjectMembers(@Payload() projectId: string) {
    return this.usersRepository.getProjectMembers(projectId);
  }

  @MessagePattern(PROJECT_MESSAGES.GET_CHARACTERS)
  async getProjectCharacters(@Payload() projectId: string) {
    return this.repository.getProjectCharacters(projectId);
  }

  @MessagePattern(PROJECT_MESSAGES.LINK_CHARACTER)
  async linkCharacter(
    @Payload()
    payload: {
      projectId: string;
      characterId: string;
      auth0Id: string;
    },
  ) {
    const { projectId, characterId, auth0Id } = payload;

    const role = await this.usersRepository.getProjectRole(auth0Id, projectId);
    if (!role) {
      throw new RpcException({ status: 403, message: 'Not a project member' });
    }

    if (role === 'WRITER') {
      const isOwner = await this.repository.verifyCharacterOwnership(
        characterId,
        auth0Id,
      );
      if (!isOwner) {
        throw new RpcException({
          status: 403,
          message: 'Writers can only link their own characters',
        });
      }
    }

    return this.repository.linkCharacter(projectId, characterId);
  }

  @MessagePattern(PROJECT_MESSAGES.UNLINK_CHARACTER)
  async unlinkCharacter(
    @Payload()
    payload: {
      projectId: string;
      characterId: string;
      auth0Id: string;
    },
  ) {
    const { projectId, characterId, auth0Id } = payload;

    const isOwner = await this.repository.verifyCharacterOwnership(
      characterId,
      auth0Id,
    );

    if (isOwner) {
      return this.repository.unlinkCharacter(projectId, characterId);
    }

    const role = await this.usersRepository.getProjectRole(auth0Id, projectId);

    if (role !== 'MODERATOR' && role !== 'OWNER') {
      throw new RpcException({
        status: 403,
        message:
          'You must own the character or be a project moderator/owner to unlink it',
      });
    }

    return this.repository.unlinkCharacter(projectId, characterId);
  }

  @MessagePattern(PROJECT_MESSAGES.GET_BY_CHARACTER)
  async getProjectsByCharacter(
    @Payload() payload: { characterId: string; auth0Id: string },
  ) {
    const { characterId, auth0Id } = payload;

    const isOwner = await this.repository.verifyCharacterOwnership(
      characterId,
      auth0Id,
    );

    if (!isOwner) {
      throw new RpcException({
        status: 403,
        message: 'Only the character owner can view its projects',
      });
    }

    return this.repository.getProjectsByCharacter(characterId);
  }
}
