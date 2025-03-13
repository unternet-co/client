import Dexie, { Table } from 'dexie';
import { Interaction } from '../core/interactions';
import { Process } from '../core/processes';
import { Resource } from '../core/resources';
import { Workspace } from '../core/workspaces';

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
