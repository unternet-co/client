import { Table } from 'dexie';
import { db } from '../lib/indexed-db';
import { ITab } from '../models/tabs';

export class DatabaseService<id, T> {
  private table: Table;

  constructor(tableName: string) {
    this.table = db[tableName];
  }

  create(item: T) {
    // this.table.add(item);
  }

  update(id: id, item: Partial<T>) {
    this.table.update(id, item);
  }
}

export const tabDatabaseService = new DatabaseService<string, ITab>('tabs');
