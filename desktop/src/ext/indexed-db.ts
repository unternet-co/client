import Dexie, { Table } from 'dexie';
import { Tab, Workspace, Interaction } from '../data-types';

export class IndexedDB extends Dexie {
  tabs!: Table<Tab, string>;
  workspaces!: Table<Workspace, string>;
  interactions!: Table<Interaction, string>;

  constructor() {
    super('DB');

    this.version(1).stores({
      tabs: 'id',
      workspaces: 'id',
      interactions: 'id,workspaceId',
    });
  }
}

export const db = new IndexedDB();
