import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DraftsRepository } from '../../db/repositories/drafts.repository';

@Controller()
export class DraftsController {
  constructor(private readonly repository: DraftsRepository) {}

  @MessagePattern({ cmd: 'get-drafts' })
  async getDrafts() {
    return await this.repository.findAll();
  }

  @MessagePattern({ cmd: 'get-draft' })
  async getDraft(@Payload() id: string) {
    return await this.repository.findById(id);
  }

  @MessagePattern({ cmd: 'create-draft' })
  async createDraft(@Payload() data: any) {
    return await this.repository.create(data);
  }

  @MessagePattern({ cmd: 'update-draft' })
  async updateDraft(@Payload() payload: { id: string; data: any }) {
    return await this.repository.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'delete-draft' })
  async deleteDraft(@Payload() id: string) {
    return await this.repository.delete(id);
  }
}
