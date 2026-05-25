import { BaseRepository } from './base.repository';
import { projectTable } from '../schema/project.table';
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { projectToMemberTable } from '../schema/projects.to.members.table';
import { and, eq } from 'drizzle-orm';
import { memberTable } from '../schema/member.table';
import { projectToCharacterTable } from '../schema/projects.to.characters.table';
import { characterTable } from '../schema/character.table';

@Injectable()
export class ProjectsRepository extends BaseRepository<typeof projectTable> {
  constructor(@Inject(DRIZZLE_CLIENT) db: NodePgDatabase) {
    super(db, projectTable);
  }

  async getProjectCharacters(projectId: string) {
    return await this.db
      .select({
        id: characterTable.id,
        name: characterTable.name,
        description: characterTable.description,
        isPublic: characterTable.isPublic,
        ownerAuth0Id: characterTable.ownerAuth0Id,
        ownerName: memberTable.username,
      })
      .from(characterTable)
      .innerJoin(
        projectToCharacterTable,
        eq(characterTable.id, projectToCharacterTable.characterId),
      )
      .leftJoin(memberTable, eq(characterTable.ownerAuth0Id, memberTable.auth0_id))
      .where(eq(projectToCharacterTable.projectId, projectId));
  }

  async linkCharacter(projectId: string, characterId: string) {
    return await this.db
      .insert(projectToCharacterTable)
      .values({ projectId, characterId })
      .onConflictDoNothing();
  }

  async unlinkCharacter(projectId: string, characterId: string) {
    return await this.db
      .delete(projectToCharacterTable)
      .where(
        and(
          eq(projectToCharacterTable.projectId, projectId),
          eq(projectToCharacterTable.characterId, characterId),
        ),
      );
  }

  async verifyCharacterOwnership(
    characterId: string,
    auth0Id: string,
  ): Promise<boolean> {
    const results = await this.db
      .select({ id: characterTable.id })
      .from(characterTable)
      .where(
        and(
          eq(characterTable.id, characterId),
          eq(characterTable.ownerAuth0Id, auth0Id),
        ),
      );
    return results.length > 0;
  }

  async getOwnerId(projectId: string): Promise<string | undefined> {
    const results = await this.db
      .select({ memberId: projectToMemberTable.memberId })
      .from(projectToMemberTable)
      .where(
        and(
          eq(projectToMemberTable.projectId, projectId),
          eq(projectToMemberTable.role, 'OWNER'),
        ),
      );

    return results[0]?.memberId || undefined;
  }

  async getProjectsByCharacter(characterId: string) {
    return await this.db
      .select({
        id: projectTable.id,
        name: projectTable.name,
        description: projectTable.description,
      })
      .from(projectTable)
      .innerJoin(
        projectToCharacterTable,
        eq(projectTable.id, projectToCharacterTable.projectId),
      )
      .where(eq(projectToCharacterTable.characterId, characterId));
  }

  async findByAuth0Id(auth0Id: string) {
    return await this.db
      .select({
        id: projectTable.id,
        name: projectTable.name,
        description: projectTable.description,
      })
      .from(projectTable)
      .innerJoin(
        projectToMemberTable,
        eq(projectTable.id, projectToMemberTable.projectId),
      )
      .innerJoin(memberTable, eq(projectToMemberTable.memberId, memberTable.id))
      .where(eq(memberTable.auth0_id, auth0Id));
  }
}
