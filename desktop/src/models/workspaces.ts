import { Interaction } from '@unternet/kernel';
import { DatabaseService } from '../services/database-service';

export interface WorkspaceRecord {
  id?: string;
  interactionIds: string[];
}

interface Workspace {
  id?: string;
  interactions: Interaction[];
}

class WorkspaceStore {
  readonly activeWorkspaces: { [id: string]: Workspace };

  create() {}

  async fromRecord(record: WorkspaceRecord) {}
}

const workspaceDatabase = new DatabaseService<string, WorkspaceRecord>(
  'workspaces'
);
