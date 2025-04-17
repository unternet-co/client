import { Dexie, Table } from 'dexie';
import { Workspace } from '../workspaces';
import { Interaction } from '../ai/interactions';

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
