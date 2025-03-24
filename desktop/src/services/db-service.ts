import { Table } from 'dexie';
import { db } from '../ext/indexed-db';

export type WhereConditions = { [key: string]: string | number };

export class DatabaseService<Id, T> {
  table: Table;

  constructor(tableName: string) {
    this.table = db[tableName];
  }

  create(item: T): Promise<void> {
    return this.table.add(item);
  }

  async delete(id: Id): Promise<void> {
    return this.table.delete(id);
  }

  // TODO: Expand to allow multiple conditions
  async where(conditions: WhereConditions) {
    const condition = Object.keys(conditions)[0];
    console.log(condition, conditions[condition]);
    return this.table.where(condition).equals(conditions[condition]).toArray();
  }

  async deleteWhere(conditions: WhereConditions) {
    return await Promise.all(
      Object.keys(conditions).map((condition) => {
        return this.table
          .where(condition)
          .equals(conditions[condition])
          .delete();
      })
    );
  }

  async update(id: Id, item: Partial<T>): Promise<void> {
    await this.table.update(id, item);
  }

  all(): Promise<T[]> {
    return this.table.toArray();
  }
}
