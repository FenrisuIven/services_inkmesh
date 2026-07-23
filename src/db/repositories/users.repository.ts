import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';

import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';

import { projectToMemberTable, memberTable } from '../schema';
import { BaseRepository } from './base.repository';

@Injectable()
export class UsersRepository extends BaseRepository<typeof memberTable> {
  constructor(@Inject(DRIZZLE_CLIENT) protected readonly db: NodePgDatabase) {
    super(db, memberTable);
  }

  async findAllUsers() {
    return this.db
      .select({
        id: memberTable.id,
        username: memberTable.username,
      })
      .from(memberTable);
  }

  async findByAuth0Id(auth0Id: string) {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.auth0_id, auth0Id));
    return results[0];
  }

  async isProjectMember(auth0Id: string, projectId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: memberTable.id })
      .from(memberTable)
      .innerJoin(
        projectToMemberTable,
        eq(memberTable.id, projectToMemberTable.memberId),
      )
      .where(
        and(
          eq(memberTable.auth0_id, auth0Id),
          eq(projectToMemberTable.projectId, projectId),
        ),
      )
      .limit(1);

    return result.length > 0;
  }

  async getProjectRole(
    auth0Id: string,
    projectId: string,
  ): Promise<string | undefined> {
    const result = await this.db
      .select({ role: projectToMemberTable.role })
      .from(memberTable)
      .innerJoin(
        projectToMemberTable,
        eq(memberTable.id, projectToMemberTable.memberId),
      )
      .where(
        and(
          eq(memberTable.auth0_id, auth0Id),
          eq(projectToMemberTable.projectId, projectId),
        ),
      )
      .limit(1);

    return (result[0]?.role as string) || undefined;
  }

  async assignRole(
    projectId: string,
    memberId: string,
    role: 'OWNER' | 'MODERATOR' | 'WRITER',
  ) {
    return this.db
      .insert(projectToMemberTable)
      .values({
        projectId,
        memberId,
        role,
      })
      .onConflictDoUpdate({
        target: [projectToMemberTable.projectId, projectToMemberTable.memberId],
        set: { role },
      })
      .returning();
  }

  async removeRole(projectId: string, memberId: string) {
    return this.db
      .delete(projectToMemberTable)
      .where(
        and(
          eq(projectToMemberTable.projectId, projectId),
          eq(projectToMemberTable.memberId, memberId),
        ),
      )
      .returning();
  }

  async getProjectMembers(projectId: string) {
    return this.db
      .select({
        memberId: projectToMemberTable.memberId,
        role: projectToMemberTable.role,
        username: memberTable.username,
      })
      .from(projectToMemberTable)
      .innerJoin(memberTable, eq(projectToMemberTable.memberId, memberTable.id))
      .where(eq(projectToMemberTable.projectId, projectId));
  }
}
