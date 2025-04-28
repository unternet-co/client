import { Dexie, Table } from 'dexie';
import { Workspace } from '../workspaces';
import { MessageRecord } from '../messages';
import { SerializedProcess } from '../processes';
import { Resource } from '@unternet/kernel';

export class IndexedDB extends Dexie {
  workspaces!: Table<Workspace, string>;
  messages!: Table<MessageRecord, string>;
  processes!: Table<SerializedProcess, string>;
  resources!: Table<Resource, string>;

  constructor() {
    super('DB');

    this.version(1).stores({
      workspaces: 'id',
      messages: 'id,workspaceId',
      processes: 'pid',
      resources: 'uri',
    });
  }
}

export const db = new IndexedDB();
