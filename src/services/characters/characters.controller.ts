import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateCharacterDto,
  UpdateCharacterDto,
  UpdateCharacterVisibilityDto,
  GetAvailableForProjectDto,
  GetMemberCharactersDto,
  GetOneCharacterDto,
  UploadCharacterImageDto,
  DeleteCharacterImageDto,
  GetCharacterImagesDto,
} from '@inkmesh/contracts';
import { CHARACTER_MESSAGES } from '@inkmesh/contracts';
import { CharactersService } from './characters.service';

@Controller()
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  // WARNING: Character: Changed the message pattern to 'characters.create'
  @MessagePattern(CHARACTER_MESSAGES.CREATE)
  create(@Payload() data: CreateCharacterDto) {
    return this.charactersService.create(data.ownerAuth0Id, data);
  }

  @MessagePattern(CHARACTER_MESSAGES.GET_ME)
  getMe(@Payload() data: GetMemberCharactersDto) {
    return this.charactersService.getMe(data.ownerAuth0Id);
  }

  @MessagePattern(CHARACTER_MESSAGES.GET_AVAILABLE_FOR_PROJECT)
  getAvailableForProject(@Payload() data: GetAvailableForProjectDto) {
    return this.charactersService.getAvailableForProject(
      data.auth0Id,
      data.projectId,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.GET_ONE)
  getOne(@Payload() data: GetOneCharacterDto) {
    //TODO: Fix logic
    if (!data.id && !data.ownerAuth0Id) {
      throw new Error(
        'Either id or ownerAuth0Id must be provided to get a character',
      );
    }
    if (!data.id) {
      throw new Error('Character id must be provided to get a character');
    }
    return this.charactersService.getOne(data.id, data.ownerAuth0Id);
  }

  @MessagePattern(CHARACTER_MESSAGES.UPDATE)
  update(
    @Payload()
    data: {
      ownerAuth0Id: string;
      characterId: string;
      dto: UpdateCharacterDto;
    },
  ) {
    return this.charactersService.update(
      data.ownerAuth0Id,
      data.characterId,
      data.dto,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.UPDATE_VISIBILITY)
  updateVisibility(
    @Payload()
    data: {
      ownerAuth0Id: string;
      characterId: string;
      dto: UpdateCharacterVisibilityDto;
    },
  ) {
    return this.charactersService.updateVisibility(
      data.ownerAuth0Id,
      data.characterId,
      data.dto,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_UPLOAD)
  uploadImage(@Payload() data: UploadCharacterImageDto) {
    console.log('--- Received IMAGES_UPLOAD request ---', data);
    return this.charactersService.uploadImage(
      data.ownerAuth0Id,
      data.characterId,
      data.file,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_DELETE)
  deleteImage(@Payload() data: DeleteCharacterImageDto) {
    return this.charactersService.deleteImage(
      data.ownerAuth0Id,
      data.characterId,
      data.imageId,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_GET)
  getImages(@Payload() data: GetCharacterImagesDto) {
    return this.charactersService.getImages(data.ownerAuth0Id, data.id);
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_DOWNLOAD)
  downloadImage(
    @Payload() data: { auth0Id: string; characterId: string; imageId: string },
  ) {
    console.log('--- Received IMAGES_DOWNLOAD request ---', data);
    return this.charactersService.downloadImage(
      data.auth0Id,
      data.characterId,
      data.imageId,
    );
  }
}
