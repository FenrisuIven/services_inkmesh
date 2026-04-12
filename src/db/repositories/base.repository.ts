import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_CLIENT } from '../drizzle/drizzle.provider';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

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
    return (await this.db.select().from(this.table as any)) as TSelect[];
  }

  async findById(id: string): Promise<TSelect | undefined> {
    const results = await this.db
      .select()
      .from(this.table as any)
      .where(eq((this.table as any).id, id));
    return results[0] as TSelect | undefined;
  }

  async create(data: TInsert): Promise<TSelect> {
    const results = (await this.db
      .insert(this.table as any)
      .values(data as any)
      .returning()) as TSelect[];
    return results[0];
  }

  async update(
    id: string,
    data: Partial<TInsert>,
  ): Promise<TSelect | undefined> {
    const results = (await this.db
      .update(this.table as any)
      .set(data as any)
      .where(eq((this.table as any).id, id))
      .returning()) as TSelect[];
    return results[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = (await this.db
      .delete(this.table as any)
      .where(eq((this.table as any).id, id))
      .returning()) as any[];
    return result.length > 0;
  }
}
