import { Table } from 'dexie';
import { db } from '../../lib/indexed-db';

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

  async update(id: Id, item: Partial<T>): Promise<void> {
    await this.table.update(id, item);
    return;
  }

  all(): Promise<T[]> {
    return this.table.toArray();
  }
}
