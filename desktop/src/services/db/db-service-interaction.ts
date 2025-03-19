import { Interaction } from '../../models/interaction';
import { Workspace } from '../../models/workspaces';
import { DatabaseService } from './db-service';

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
