import { Dexie, Table } from 'dexie';
import { WorkspaceRecord } from '../models/workspace-model';
import { MessageRecord } from '../models/message-model';
import { ProcessSnapshot } from '../models/process-model';
import { Resource } from '@unternet/kernel';

export class IndexedDB extends Dexie {
  workspaces!: Table<WorkspaceRecord, string>;
  messages!: Table<MessageRecord, string>;
  processes!: Table<ProcessSnapshot, string>;
  resources!: Table<Resource, string>;

  constructor() {
    super('DB');

    this.version(1).stores({
      workspaces: 'id',
      messages: 'id,workspaceId,active',
      processes: 'pid,workspaceId',
      resources: 'uri',
    });
  }
}

export const db = new IndexedDB();
