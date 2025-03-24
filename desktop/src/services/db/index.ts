import { Tab } from '../../models/tabs';
import { Workspace } from '../../models/workspaces';
import { DatabaseService } from './db-service';
import { InteractionDatabaseService } from './db-service-interaction';

export { DatabaseService, InteractionDatabaseService };

export const workspaceDatabase = new DatabaseService<string, Workspace>(
  'workspaces'
);
export const tabDatabase = new DatabaseService<string, Tab>('tabs');

export const interactionDatabase = new InteractionDatabaseService();
