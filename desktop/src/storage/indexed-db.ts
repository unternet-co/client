import { Dexie, Table } from 'dexie';
import { WorkspaceRecord } from '../workspaces';
import { MessageRecord } from '../messages';
import { SerializedProcess } from '../processes';
import { Resource } from '@unternet/kernel';

export class IndexedDB extends Dexie {
  workspaces!: Table<WorkspaceRecord, string>;
  messages!: Table<MessageRecord, string>;
  processes!: Table<SerializedProcess, string>;
  resources!: Table<Resource, string>;

  constructor() {
    super('DB');

    this.version(1).stores({
      workspaces: 'id',
      messages: 'id,workspaceId,active',
      processes: 'pid',
      resources: 'uri',
    });
  }
}

export const db = new IndexedDB();
