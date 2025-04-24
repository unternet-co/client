import { Dexie, Table } from 'dexie';
import { Workspace } from '../workspaces';
import { MessageRecord } from '../messages';
import { SerializedProcess } from '../processes';

export class IndexedDB extends Dexie {
  workspaces!: Table<Workspace, string>;
  messages!: Table<MessageRecord, string>;
  processes!: Table<SerializedProcess, string>;

  constructor() {
    super('DB');

    this.version(1).stores({
      workspaces: 'id',
      messages: 'id,workspaceId',
      processes: 'pid',
    });
  }
}

export const db = new IndexedDB();
