import Dexie, { Table } from 'dexie';
import { Tab } from './tabs';
import { Config } from './config';

export class Database extends Dexie {
  config!: Table<{ key: keyof Config; value: string }, string>;
  tabs!: Table<Tab, number>;

  constructor() {
    super('co.unternet.desktop');

    this.version(1).stores({
      tabs: '++id',
      config: 'key',
    });
  }
}

export default new Database();
