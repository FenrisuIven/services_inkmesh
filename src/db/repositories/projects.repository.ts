import { BaseRepository } from './base.repository';
import { projectTable } from '../schema/project.table';
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { projectToMemberTable } from '../schema/projects.to.members.table';
import { and, eq } from 'drizzle-orm';
import { memberTable } from '../schema/member.table';

@Injectable()
export class ProjectsRepository extends BaseRepository<typeof projectTable> {
  constructor(@Inject(DRIZZLE_CLIENT) db: NodePgDatabase) {
    super(db, projectTable);
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
