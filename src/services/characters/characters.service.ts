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
    // isPublic not synced in DB yet, returning current character
    const character = await this.charactersRepository.findById(characterId);
    return character as CharacterResponseDto;
  }

  async uploadImage(
    auth0Id: string,
    characterId: string,
    file: { buffer: Buffer; size: number; originalname: string },
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

    const imageId = uuidv4();
    const filePath = `/characters/${characterId}/${imageId}`;
    await this.googleDriveService.uploadFileContent(
      filePath,
      file.buffer.toString('base64'),
    );

    return {
      id: imageId,
      url: `mock://gdrive${filePath}`,
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

    // Mock delete from GDrive
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

    return [
      {
        id: 'mock-img-1',
        url: `mock://gdrive/characters/${characterId}/mock-img-1`,
      },
      {
        id: 'mock-img-2',
        url: `mock://gdrive/characters/${characterId}/mock-img-2`,
      },
    ];
  }
}
