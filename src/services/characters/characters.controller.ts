import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateCharacterPayload,
  DeleteCharacterImagePayload,
  GetAvailableForProjectPayload,
  GetCharacterImagesPayload,
  GetMemberCharactersPayload,
  GetOneCharacterPayload,
  UpdateCharacterPayload,
  UpdateCharacterVisibilityPayload,
  UploadCharacterImagePayload,
  GetDownloadCharacterImagePayload,
} from '@inkmesh/contracts';
import { CHARACTER_MESSAGES } from '@inkmesh/contracts';
import { CharactersService } from './characters.service';

@Controller()
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  // WARNING: Character: Changed the message pattern to 'characters.create'
  @MessagePattern(CHARACTER_MESSAGES.CREATE)
  create(@Payload() payload: CreateCharacterPayload) {
    return this.charactersService.create(payload.ownerAuth0Id, payload.data);
  }

  @MessagePattern(CHARACTER_MESSAGES.GET_ME)
  getMe(@Payload() payload: GetMemberCharactersPayload) {
    return this.charactersService.getMe(payload.ownerAuth0Id);
  }

  @MessagePattern(CHARACTER_MESSAGES.GET_AVAILABLE_FOR_PROJECT)
  getAvailableForProject(@Payload() payload: GetAvailableForProjectPayload) {
    return this.charactersService.getAvailableForProject(
      payload.ownerAuth0Id,
      payload.projectId,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.GET_ONE)
  getOne(@Payload() payload: GetOneCharacterPayload) {
    //TODO: Fix logic
    if (!payload.id && !payload.ownerAuth0Id) {
      throw new Error(
        'Either id or ownerAuth0Id must be provided to get a character',
      );
    }
    if (!payload.id) {
      throw new Error('Character id must be provided to get a character');
    }
    return this.charactersService.getOne(payload.id, payload.ownerAuth0Id);
  }

  @MessagePattern(CHARACTER_MESSAGES.UPDATE)
  update(@Payload() payload: UpdateCharacterPayload) {
    return this.charactersService.update(
      payload.ownerAuth0Id,
      payload.characterId,
      payload.data,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.UPDATE_VISIBILITY)
  updateVisibility(@Payload() payload: UpdateCharacterVisibilityPayload) {
    return this.charactersService.updateVisibility(
      payload.ownerAuth0Id,
      payload.characterId,
      payload.data,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_UPLOAD)
  uploadImage(@Payload() payload: UploadCharacterImagePayload) {
    console.log('--- Received IMAGES_UPLOAD request ---', payload);
    return this.charactersService.uploadImage(
      payload.ownerAuth0Id,
      payload.characterId,
      payload.file,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_DELETE)
  deleteImage(@Payload() payload: DeleteCharacterImagePayload) {
    return this.charactersService.deleteImage(
      payload.ownerAuth0Id,
      payload.characterId,
      payload.imageId,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_GET)
  getImages(@Payload() payload: GetCharacterImagesPayload) {
    return this.charactersService.getImages(payload.ownerAuth0Id, payload.id);
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_DOWNLOAD)
  downloadImage(@Payload() payload: GetDownloadCharacterImagePayload) {
    console.log('--- Received IMAGES_DOWNLOAD request ---', payload);
    return this.charactersService.downloadImage(
      payload.auth0Id,
      payload.characterId,
      payload.imageId,
    );
  }
}
