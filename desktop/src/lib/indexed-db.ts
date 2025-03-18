import Dexie, { Table } from 'dexie';
import { ITab } from '../models/tabs';

export class IndexedDB extends Dexie {
  tabs!: Table<ITab, string>;

  constructor() {
    super('DB');

    this.version(1).stores({
      tabs: 'id',
    });
  }
}

export const db = new IndexedDB();
