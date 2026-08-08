import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { CharactersRepository } from '../../db/repositories/characters.repository';
import { UsersService } from '../users/users.service';
import { GoogleDriveService } from './google-drive.service';
import type {
  CharacterImageResponseDto,
  CharacterResponseDto,
  CreateCharacterDto,
  SerializedFileDto,
  UpdateCharacterDto,
  UpdateCharacterVisibilityDto,
} from '@inkmesh/contracts';

@Injectable()
export class CharactersService {
  constructor(
    private readonly charactersRepository: CharactersRepository,
    private readonly usersService: UsersService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async create(
    auth0Id: string,
    dto: CreateCharacterDto,
  ): Promise<CharacterResponseDto> {
    const count = await this.charactersRepository.countByOwner(auth0Id);
    if (count >= 10) {
      throw new RpcException({
        status: 403,
        message: 'Maximum 10 characters per user reached',
      });
    }

    const member = await this.usersService.findByAuth0Id(auth0Id);
    if (!member) {
      throw new RpcException({ status: 404, message: 'User member not found' });
    }

    return await this.charactersRepository.createWithMember(
      {
        name: dto.name,
        description: dto.description,
        ownerAuth0Id: auth0Id,
      },
      member.id,
    );
  }

  async getMe(auth0Id: string): Promise<CharacterResponseDto[]> {
    return await this.charactersRepository.findByOwner(auth0Id);
  }

  async getAvailableForProject(
    auth0Id: string,
    projectId: string,
  ): Promise<CharacterResponseDto[]> {
    const role = await this.usersService.getProjectRole(auth0Id, projectId);
    if (!role) {
      throw new RpcException({
        status: 403,
        message: 'Not a member of this project',
      });
    }

    return await this.charactersRepository.getAvailableForProject(
      projectId,
      auth0Id,
      role,
    );
  }

  async getOne(
    characterId: string,
    auth0Id?: string,
  ): Promise<CharacterResponseDto> {
    const character: CharacterResponseDto | undefined =
      await this.charactersRepository.findById(characterId);

    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    // TODO: Switch to checking the "allowed" list
    if (character.ownerAuth0Id !== auth0Id) {
      throw new RpcException({
        status: 403,
        message: 'Only authorized users can view this character',
      });
    }

    return character;
  }

  async update(
    auth0Id: string,
    characterId: string,
    dto: UpdateCharacterDto,
  ): Promise<CharacterResponseDto | undefined> {
    const character: CharacterResponseDto | undefined =
      await this.charactersRepository.findById(characterId);

    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    if (character.ownerAuth0Id !== auth0Id) {
      throw new RpcException({
        status: 403,
        message: 'Only the owner can edit this character',
      });
    }

    return await this.charactersRepository.update(characterId, dto);
  }

  async updateVisibility(
    auth0Id: string,
    characterId: string,
    dto: UpdateCharacterVisibilityDto,
  ): Promise<CharacterResponseDto | undefined> {
    const character: CharacterResponseDto | undefined =
      await this.charactersRepository.findById(characterId);

    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    if (character.ownerAuth0Id !== auth0Id) {
      throw new RpcException({
        status: 403,
        message: 'Only the owner can edit this character',
      });
    }

    character.isPublic = dto.isPublic;

    return await this.charactersRepository.update(characterId, character);
  }

  async uploadImage(
    auth0Id: string,
    characterId: string,
    file: SerializedFileDto,
  ): Promise<CharacterImageResponseDto> {
    if (file.size > 2 * 1024 * 1024) {
      throw new RpcException({
        status: 413,
        message: 'File size exceeds 2MB limit',
      });
    }

    const character: CharacterResponseDto | undefined =
      await this.charactersRepository.findById(characterId);

    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    if (character.ownerAuth0Id !== auth0Id) {
      throw new RpcException({
        status: 403,
        message: 'Only the owner can upload images',
      });
    }

    const buffer = Buffer.from(file.buffer.data);

    const imageId = uuidv4();
    const gDriveFileId = await this.googleDriveService.uploadImage(
      characterId,
      imageId,
      buffer,
      file.mimetype,
    );

    return {
      id: gDriveFileId,
      url: `gdrive://${gDriveFileId}`,
    };
  }

  async deleteImage(
    auth0Id: string,
    characterId: string,
    imageId: string,
  ): Promise<void> {
    const character: CharacterResponseDto | undefined =
      await this.charactersRepository.findById(characterId);

    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    if (character.ownerAuth0Id !== auth0Id) {
      throw new RpcException({
        status: 403,
        message: 'Only the owner can delete images',
      });
    }

    await this.googleDriveService.deleteImage(characterId, imageId);

    return;
  }

  async getImages(
    auth0Id: string,
    characterId: string,
  ): Promise<CharacterImageResponseDto[]> {
    const character: CharacterResponseDto | undefined =
      await this.charactersRepository.findById(characterId);

    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    // TODO: Switch to checking the "allowed" list
    if (character.ownerAuth0Id !== auth0Id) {
      throw new RpcException({
        status: 403,
        message: 'Only authorized users can view images of this character',
      });
    }

    const images = await this.googleDriveService.listImages(characterId);

    return images.map((img) => ({
      id: img.id,
      url: `gdrive://${img.id}`,
    }));
  }

  async downloadImage(
    auth0Id: string,
    characterId: string,
    imageId: string,
  ): Promise<Buffer> {
    const character: CharacterResponseDto | undefined =
      await this.charactersRepository.findById(characterId);

    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    // TODO: Switch to checking the "allowed" list
    if (character.ownerAuth0Id !== auth0Id) {
      throw new RpcException({
        status: 403,
        message: 'Only the authorized users can download images',
      });
    }

    return await this.googleDriveService.downloadImage(imageId);
  }
}
