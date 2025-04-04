import { Dexie, Table } from 'dexie';
import { Workspace } from '../core/workspaces';
import { Interaction } from '../core/interactions';

export class IndexedDB extends Dexie {
  workspaces!: Table<Workspace, string>;
  interactions!: Table<Interaction, string>;

  constructor() {
    super('DB');

    this.version(1).stores({
      workspaces: 'id',
      interactions: 'id,workspaceId',
    });
  }
}

export const db = new IndexedDB();
