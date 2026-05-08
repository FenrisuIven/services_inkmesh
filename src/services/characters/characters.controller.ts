import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CHARACTER_MESSAGES,
  CreateCharacterDto,
  UpdateCharacterDto,
  UpdateCharacterVisibilityDto,
} from '@inkmesh/contracts';
import { CharactersService } from './characters.service';

@Controller()
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @MessagePattern(CHARACTER_MESSAGES.CREATE)
  create(@Payload() data: { auth0Id: string; dto: CreateCharacterDto }) {
    return this.charactersService.create(data.auth0Id, data.dto);
  }

  @MessagePattern(CHARACTER_MESSAGES.GET_ME)
  getMe(@Payload() data: { auth0Id: string }) {
    return this.charactersService.getMe(data.auth0Id);
  }

  @MessagePattern(CHARACTER_MESSAGES.GET_ONE)
  getOne(@Payload() data: { auth0Id: string; characterId: string }) {
    return this.charactersService.getOne(data.auth0Id, data.characterId);
  }

  @MessagePattern(CHARACTER_MESSAGES.UPDATE)
  update(
    @Payload()
    data: {
      auth0Id: string;
      characterId: string;
      dto: UpdateCharacterDto;
    },
  ) {
    return this.charactersService.update(
      data.auth0Id,
      data.characterId,
      data.dto,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.UPDATE_VISIBILITY)
  updateVisibility(
    @Payload()
    data: {
      auth0Id: string;
      characterId: string;
      dto: UpdateCharacterVisibilityDto;
    },
  ) {
    return this.charactersService.updateVisibility(
      data.auth0Id,
      data.characterId,
      data.dto,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_UPLOAD)
  uploadImage(
    @Payload() data: { auth0Id: string; characterId: string; file: any },
  ) {
    return this.charactersService.uploadImage(
      data.auth0Id,
      data.characterId,
      data.file,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_DELETE)
  deleteImage(
    @Payload()
    data: {
      auth0Id: string;
      characterId: string;
      imageId: string;
    },
  ) {
    return this.charactersService.deleteImage(
      data.auth0Id,
      data.characterId,
      data.imageId,
    );
  }

  @MessagePattern(CHARACTER_MESSAGES.IMAGES_GET)
  getImages(@Payload() data: { auth0Id: string; characterId: string }) {
    return this.charactersService.getImages(data.auth0Id, data.characterId);
  }
}
