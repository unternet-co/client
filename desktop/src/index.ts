import { initTabStoreData, TabModel, TabStoreData } from './core/tabs';
import { Interaction } from './core/interactions';
import { Workspace, WorkspaceModel } from './core/workspaces';
import { dependencies } from './common/dependencies';
import { DatabaseService } from './storage/database-service';
import { KeyStoreService } from './storage/keystore-service';
import { ShortcutService } from './shortcuts/shortcut-service';
import { appendEl, createEl } from './common/utils/dom';
import { registerGlobalShortcuts } from './shortcuts/global-shortcuts';
import { ModalService } from './modals/modal-service';
import './ui/common/styles/global.css';
import './ui/common/styles/reset.css';
import './ui/common/styles/markdown.css';
import './ui/modals/settings-modal';
import './ui/app-root';
import { ConfigData, ConfigModel, initConfig } from './core/config';

/* Initialize databases & stores */

const workspaceDatabaseService = new DatabaseService<string, Workspace>(
  'workspaces'
);
const interactionDatabaseService = new DatabaseService<string, Interaction>(
  'interactions'
);
const tabKeyStore = new KeyStoreService<TabStoreData>('tabs', initTabStoreData);
const configStore = new KeyStoreService<ConfigData>('config', initConfig);

/* Initialize models */

const workspaceModel = new WorkspaceModel(
  workspaceDatabaseService,
  interactionDatabaseService
);
const tabModel = new TabModel(tabKeyStore, workspaceModel);
const configModel = new ConfigModel(configStore);

/* Initialize kernel & LLMs */

// const kernel = new Kernel({ model: createModel(), workspaceModel });

/* Initialize services */

const shortcutService = new ShortcutService();
const modalService = new ModalService();

/* Register dependencies */

dependencies.registerSingleton('WorkspaceModel', workspaceModel);
dependencies.registerSingleton('TabModel', tabModel);
dependencies.registerSingleton('ConfigModel', configModel);
// dependencies.registerSingleton('Kernel', kernel);
dependencies.registerSingleton('ShortcutService', shortcutService);
dependencies.registerSingleton('ModalService', modalService);

/* Register global modals */

modalService.register('settings', {
  title: 'Settings',
  element: 'settings-modal',
});

/* Register keyboard shortcuts */

registerGlobalShortcuts();

/* Initialize UI */

appendEl(document.body, createEl('app-root'));
