import { initTabStoreData, TabModel, TabStoreData } from './models/tabs';
import { Interaction } from './models/interactions';
import { Workspace, WorkspaceModel } from './models/workspaces';
import { dependencies } from './base/dependencies';
import { DatabaseService } from './services/database-service';
import { KeyStoreService } from './services/keystore-service';
import { ShortcutService } from './services/shortcut-service';
import { Kernel } from './kernel';
import { createModel } from './ext/llm';
import { appendEl, createEl } from './utils/dom';
import './ui/common/styles/global.css';
import './ui/common/styles/reset.css';
import './ui/common/styles/markdown.css';
import './ui/app-root';

const workspaceDatabaseService = new DatabaseService<string, Workspace>(
  'workspaces'
);
const interactionDatabaseService = new DatabaseService<string, Interaction>(
  'interactions'
);
const tabKeyStore = new KeyStoreService<TabStoreData>('tabs', initTabStoreData);

dependencies.registerSingleton(
  'WorkspaceModel',
  new WorkspaceModel(workspaceDatabaseService, interactionDatabaseService)
);

dependencies.registerSingleton(
  'TabModel',
  new TabModel(tabKeyStore, dependencies.resolve('WorkspaceModel'))
);

dependencies.registerSingleton('Kernel', new Kernel({ model: createModel() }));

new ShortcutService(dependencies.resolve('TabModel'));

appendEl(document.body, createEl('app-root'));
