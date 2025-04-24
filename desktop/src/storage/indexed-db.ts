import { Dexie, Table } from 'dexie';
import { Workspace } from '../workspaces';
import { MessageRecord } from '../messages';

export class IndexedDB extends Dexie {
  workspaces!: Table<Workspace, string>;
  messages!: Table<MessageRecord, string>;

  constructor() {
    super('DB');

    this.version(1).stores({
      workspaces: 'id',
      messages: 'id,workspaceId',
    });
  }
}

export const db = new IndexedDB();
