import Dexie, { Table } from 'dexie';
import { Interaction } from '../kernel/interactions';
import { Process } from '../kernel/processes';
import { Resource } from '../kernel/resources';
import { Workspace } from '../kernel/workspaces';

export class Database extends Dexie {
  interactions!: Table<Interaction, number>;
  processes!: Table<Process, number>;
  resources!: Table<Resource, string>;
  workspaces!: Table<Workspace, number>;

  constructor() {
    super('co.unternet.kernel');

    this.version(1).stores({
      workspaces: '++id',
      interactions: '++id',
      processes: '++id',
      resources: 'url',
    });
  }
}

export default new Database();
