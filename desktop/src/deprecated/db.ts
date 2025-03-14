import Dexie, { Table } from 'dexie';
import { Tab } from './tabs';
import { Config } from './config';
import { Interaction } from './kernel/interactions';
import { Process } from './kernel/processes';
import { Resource } from './kernel/resources';
import { Workspace } from './kernel/workspaces';

export class Database extends Dexie {
  config!: Table<{ key: keyof Config; value: string }, string>;
  tabs!: Table<Tab, number>;
  interactions!: Table<Interaction, number>;
  processes!: Table<Process, number>;
  resources!: Table<Resource, string>;
  workspaces!: Table<Workspace, number>;

  constructor() {
    super('co.unternet.desktop');

    this.version(1).stores({
      workspaces: '++id',
      interactions: '++id',
      processes: '++id',
      resources: 'url',
      tabs: '++id',
      config: 'key',
    });
  }
}

export default new Database();
