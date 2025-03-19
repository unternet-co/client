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

  forWorkspace(workspaceId: Workspace['id']) {
    this.table.where({ workspaceId });
  }
}
