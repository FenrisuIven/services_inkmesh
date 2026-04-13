import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';
import { memberTable } from '../schema/member.table';
import { projectToMemberTable } from '../schema/projects.to.members.table';
import { BaseRepository } from './base.repository';

@Injectable()
export class UsersRepository extends BaseRepository<typeof memberTable> {
  constructor(@Inject(DRIZZLE_CLIENT) protected readonly db: NodePgDatabase) {
    super(db, memberTable);
  }

  async findByAuth0Id(auth0Id: string) {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.auth0_id, auth0Id));
    return results[0];
  }

  async assignRole(projectId: string, memberId: string, role: any) {
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
      .select()
      .from(projectToMemberTable)
      .where(eq(projectToMemberTable.projectId, projectId));
  }
}
