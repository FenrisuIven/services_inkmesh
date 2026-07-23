import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';

@Injectable()
export abstract class BaseRepository<
  TTable extends PgTableWithColumns<any>,
  TInsert = TTable['_']['inferInsert'],
  TSelect = TTable['_']['inferSelect'],
> {
  constructor(
    @Inject(DRIZZLE_CLIENT) protected readonly db: NodePgDatabase,
    protected readonly table: TTable,
  ) {}

  async findAll(): Promise<TSelect[]> {
    return (await this.db
      .select()
      .from(this.table as PgTableWithColumns<any>)) as TSelect[];
  }

  async findById(id: string): Promise<TSelect | undefined> {
    const results = await this.db
      .select()
      .from(this.table as PgTableWithColumns<any>)
      .where(eq(this.table.id, id));
    return results[0] as TSelect | undefined;
  }

  async create(data: TInsert): Promise<TSelect> {
    const results = await this.db.insert(this.table).values(data).returning();
    return results[0] as TSelect;
  }

  async update(
    id: string,
    data: Partial<TInsert>,
  ): Promise<TSelect | undefined> {
    const results: Record<string, any> = await this.db
      .update(this.table)
      .set(data as Record<string, any>)
      .where(eq(this.table.id, id))
      .returning();
    return results[0] as TSelect | undefined;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();
    return result.length > 0;
  }
}
