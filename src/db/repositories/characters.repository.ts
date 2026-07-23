import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, sql, or, notExists } from 'drizzle-orm';

import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';

import {
  characterTable,
  characterToMemberTable,
  projectToCharacterTable,
  memberTable,
} from '../schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class CharactersRepository extends BaseRepository<
  typeof characterTable
> {
  constructor(@Inject(DRIZZLE_CLIENT) protected readonly db: NodePgDatabase) {
    super(db, characterTable);
  }

  async getAvailableForProject(
    projectId: string,
    auth0Id: string,
    role: string,
  ) {
    const isCharacterLinked = this.db
      .select()
      .from(projectToCharacterTable)
      .where(
        and(
          eq(projectToCharacterTable.projectId, projectId),
          eq(projectToCharacterTable.characterId, characterTable.id),
        ),
      );

    const baseQuery = this.db
      .select({
        id: characterTable.id,
        name: characterTable.name,
        description: characterTable.description,
        isPublic: characterTable.isPublic,
        ownerAuth0Id: characterTable.ownerAuth0Id,
        ownerName: memberTable.username,
      })
      .from(characterTable)
      .leftJoin(
        memberTable,
        eq(characterTable.ownerAuth0Id, memberTable.auth0_id),
      );

    if (role === 'WRITER') {
      return baseQuery.where(
        and(
          eq(characterTable.ownerAuth0Id, auth0Id),
          notExists(isCharacterLinked),
        ),
      );
    }

    return baseQuery.where(
      and(
        or(
          eq(characterTable.isPublic, true),
          eq(characterTable.ownerAuth0Id, auth0Id),
        ),
        notExists(isCharacterLinked),
      ),
    );
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

  async createWithMember(
    data: typeof characterTable.$inferInsert,
    memberId: string,
  ) {
    return await this.db.transaction(async (tx) => {
      const character = await tx.insert(this.table).values(data).returning();

      const charId = character[0].id;

      await tx.insert(characterToMemberTable).values({
        characterId: charId,
        memberId: memberId,
      });

      return character[0];
    });
  }
}
