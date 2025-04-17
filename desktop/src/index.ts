import { initTabStoreData, TabModel, TabStoreData } from './tabs';
import { Interaction } from './ai/interactions';
import { Workspace, WorkspaceModel } from './workspaces';
import { dependencies } from './common/dependencies';
import { DatabaseService } from './storage/database-service';
import { KeyStoreService } from './storage/keystore-service';
import { ShortcutService } from './shortcuts/shortcut-service';
import { appendEl, createEl } from './common/utils/dom';
import { registerGlobalShortcuts } from './shortcuts/global-shortcuts';
import { ModalService } from './modals/modal-service';
import { ConfigData, ConfigModel, initConfig } from './config';
import { Kernel } from './ai/kernel';
import { OpenAIModelProvider } from './ai/providers/openai';
import { OllamaModelProvider } from './ai/providers/ollama';
import { AIModelService } from './ai/ai-models';
import './ui/common/styles/global.css';
import './ui/common/styles/reset.css';
import './ui/common/styles/markdown.css';
import './modals/global/settings-modal';
import './ui/app-root';
import { ResourceModel, initialResources } from './protocols/resources';
import { protocols } from './protocols/protocols';

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
dependencies.registerSingleton('WorkspaceModel', workspaceModel);

const tabModel = new TabModel(tabKeyStore, workspaceModel);
dependencies.registerSingleton('TabModel', tabModel);

const configModel = new ConfigModel(configStore);
dependencies.registerSingleton('ConfigModel', configModel);

const resourceModel = new ResourceModel({ initialResources });
dependencies.registerSingleton('ResourceModel', resourceModel);

/* Initialize kernel & LLMs */

const openAIModelProvider = new OpenAIModelProvider();
const ollamaModelProvider = new OllamaModelProvider();
const aiModelService = new AIModelService({
  openai: openAIModelProvider,
  ollama: ollamaModelProvider,
});
dependencies.registerSingleton('AIModelService', aiModelService);

const kernel = new Kernel({
  workspaceModel,
  configModel,
  aiModelService,
  resourceModel,
  protocols,
});
dependencies.registerSingleton('Kernel', kernel);

/* Initialize other services */

const shortcutService = new ShortcutService();
dependencies.registerSingleton('ShortcutService', shortcutService);

const modalService = new ModalService();
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

// Open settings if no model defined
const config = configModel.get();
if (
  !config.ai.primaryModel ||
  !config.ai.primaryModel.provider ||
  !config.ai.primaryModel.name
) {
  console.warn('Primary model not defined in config, opening settings modal');
  modalService.open('settings');
}
