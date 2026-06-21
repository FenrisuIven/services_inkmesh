import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { CharactersRepository } from '../../db/repositories/characters.repository';
import { UsersService } from '../users/users.service';
import { GoogleDriveService } from './google-drive.service';
import {
  CreateCharacterDto,
  UpdateCharacterDto,
  UpdateCharacterVisibilityDto,
  CharacterResponseDto,
  CharacterImageResponseDto,
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

    const character = await this.charactersRepository.createWithMember(
      {
        name: dto.name,
        description: dto.description,
        ownerAuth0Id: auth0Id,
      },
      member.id,
    );

    return character as CharacterResponseDto;
  }

  async getMe(auth0Id: string): Promise<CharacterResponseDto[]> {
    const characters = await this.charactersRepository.findByOwner(auth0Id);
    return characters as CharacterResponseDto[];
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

    const characters = await this.charactersRepository.getAvailableForProject(
      projectId,
      auth0Id,
      role,
    );

    return characters as CharacterResponseDto[];
  }

  async getOne(
    auth0Id: string,
    characterId: string,
  ): Promise<CharacterResponseDto> {
    const character = await this.charactersRepository.findById(characterId);
    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    return character as CharacterResponseDto;
  }

  async update(
    auth0Id: string,
    characterId: string,
    dto: UpdateCharacterDto,
  ): Promise<CharacterResponseDto> {
    const character = await this.charactersRepository.findById(characterId);
    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    if (character.ownerAuth0Id !== auth0Id) {
      throw new RpcException({
        status: 403,
        message: 'Only the owner can edit this character',
      });
    }

    const updated = await this.charactersRepository.update(characterId, dto);
    return updated as CharacterResponseDto;
  }

  async updateVisibility(
    auth0Id: string,
    characterId: string,
    dto: UpdateCharacterVisibilityDto,
  ): Promise<CharacterResponseDto> {
    const character = await this.charactersRepository.findById(characterId);
    return character as CharacterResponseDto;
  }

  async uploadImage(
    auth0Id: string,
    characterId: string,
    file: { buffer: Buffer; size: number; originalname: string; mimetype: string },
  ): Promise<CharacterImageResponseDto> {
    if (file.size > 2 * 1024 * 1024) {
      throw new RpcException({
        status: 413,
        message: 'File size exceeds 2MB limit',
      });
    }

    const character = await this.charactersRepository.findById(characterId);
    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    if (character.ownerAuth0Id !== auth0Id) {
      throw new RpcException({
        status: 403,
        message: 'Only the owner can upload images',
      });
    }

    // Convert the received serialized object to a real Buffer
    const buffer = Buffer.isBuffer(file.buffer) 
      ? file.buffer 
      : Buffer.from((file.buffer as any).data);

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
    const character = await this.charactersRepository.findById(characterId);
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
    const character = await this.charactersRepository.findById(characterId);
    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    const images = await this.googleDriveService.listImages(characterId);

    return images.map(img => ({
      id: img.id,
      url: `gdrive://${img.id}`,
    }));
  }

  async downloadImage(auth0Id: string, characterId: string, imageId: string): Promise<Buffer> {
    const character = await this.charactersRepository.findById(characterId);
    if (!character) {
      throw new RpcException({ status: 404, message: 'Character not found' });
    }

    // Optional: add authorization check here to ensure the user can view the character/image
    
    return await this.googleDriveService.downloadImage(imageId);
  }
}
