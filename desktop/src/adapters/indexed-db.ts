import Dexie, { Table } from 'dexie';
import { Tab } from '../models/tabs';
import { WorkspaceRecord } from '../models/workspaces';
import { Interaction } from '../models/interaction';

export class IndexedDB extends Dexie {
  tabs!: Table<Tab, string>;
  workspaces!: Table<WorkspaceRecord, string>;
  interactions!: Table<Interaction, string>;

  constructor() {
    super('DB');

    this.version(1).stores({
      tabs: 'id',
    });
  }
}

export const db = new IndexedDB();
