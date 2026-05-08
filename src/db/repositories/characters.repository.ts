import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';
import { characterTable } from '../schema/character.table';
import { characterToMemberTable } from '../schema/characters.to.members.table';
import { BaseRepository } from './base.repository';

@Injectable()
export class CharactersRepository extends BaseRepository<typeof characterTable> {
  constructor(@Inject(DRIZZLE_CLIENT) protected readonly db: NodePgDatabase) {
    super(db, characterTable);
  }

  async findByOwner(auth0Id: string) {
    return this.db
      .select()
      .from(this.table)
      .where(eq(this.table.ownerAuth0Id, auth0Id));
  }

  async countByOwner(auth0Id: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(eq(this.table.ownerAuth0Id, auth0Id));
    return Number(result[0]?.count ?? 0);
  }

  async createWithMember(data: typeof characterTable.$inferInsert, memberId: string) {
    return await this.db.transaction(async (tx) => {
      const character = await tx
        .insert(this.table)
        .values(data)
        .returning();

      const charId = character[0].id;

      await tx.insert(characterToMemberTable).values({
        characterId: charId,
        memberId: memberId,
      });

      return character[0];
    });
  }
}
