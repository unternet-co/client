import { Table } from 'dexie';
import { db } from '../ext/indexed-db';
import { Workspace, Tab, Interaction } from '../data-types';

export class DatabaseService<Id, T> {
  table: Table;

  constructor(tableName: string) {
    this.table = db[tableName];
  }

  create(item: T): Promise<void> {
    return this.table.add(item);
  }

  async delete(id: Id): Promise<void> {
    return this.table.delete(id);
  }

  async update(id: Id, item: Partial<T>): Promise<void> {
    await this.table.update(id, item);
    return;
  }

  all(): Promise<T[]> {
    return this.table.toArray();
  }
}

export class InteractionDatabaseService extends DatabaseService<
  string,
  Interaction
> {
  constructor() {
    super('interactions');
  }

  deleteWithWorkspace(workspaceId: Workspace['id']) {
    return this.table.where('workspaceId').equals(workspaceId).delete();
  }
}

export const workspaceDatabase = new DatabaseService<string, Workspace>(
  'workspaces'
);

export const tabDatabase = new DatabaseService<string, Tab>('tabs');

export const interactionDatabase = new InteractionDatabaseService();
