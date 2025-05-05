import { initTabStoreData, TabModel, TabStoreData } from './tabs';
import { MessageRecord } from './messages';
import { WorkspaceRecord, WorkspaceModel } from './workspaces';
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
import { ResourceModel, initialResources } from './resources';
import { ProcessModel, SerializedProcess } from './processes';
import { ProcessRuntime, Resource } from '@unternet/kernel';
import { protocols } from './protocols/protocols';
import './ui/common/styles/global.css';
import './ui/common/styles/reset.css';
import './ui/common/styles/markdown.css';
import './modals/global/settings-modal';
import './ui/app-root';
import './modals/global/bug-modal';
import './ui/workspaces/workspace-settings-modal';
import './ui/workspaces/workspace-delete-modal';

/* Initialize databases & stores */

const workspaceDatabaseService = new DatabaseService<string, WorkspaceRecord>(
  'workspaces'
);
const processDatabaseService = new DatabaseService<string, SerializedProcess>(
  'processes'
);
const messageDatabaseService = new DatabaseService<string, MessageRecord>(
  'messages'
);
const resourceDatabaseService = new DatabaseService<string, Resource>(
  'resources'
);
const tabKeyStore = new KeyStoreService<TabStoreData>('tabs', initTabStoreData);
const configStore = new KeyStoreService<ConfigData>('config', initConfig);

/* Initialize model dependencies */

const runtime = new ProcessRuntime(protocols, { processLimit: 1 });

/* Initialize models */

const processModel = new ProcessModel(processDatabaseService, runtime);
dependencies.registerSingleton('ProcessModel', ProcessModel);

const configModel = new ConfigModel(configStore);
dependencies.registerSingleton('ConfigModel', configModel);

const workspaceModel = new WorkspaceModel(
  workspaceDatabaseService,
  messageDatabaseService,
  processModel,
  configModel
);
dependencies.registerSingleton('WorkspaceModel', workspaceModel);

const tabModel = new TabModel(tabKeyStore, workspaceModel);
dependencies.registerSingleton('TabModel', tabModel);

const resourceModel = new ResourceModel({
  resourceDatabaseService,
  initialResources,
});
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
  runtime,
});
dependencies.registerSingleton('Kernel', kernel);

/* Initialize other services */

const shortcutService = new ShortcutService();
dependencies.registerSingleton('ShortcutService', shortcutService);

const modalService = new ModalService();
dependencies.registerSingleton('ModalService', modalService);

/* Register global modals */

modalService.register('settings', {
  element: 'settings-modal',
});

modalService.register('bug', {
  element: 'bug-modal',
});

modalService.register('workspace-settings', {
  element: 'workspace-settings-modal',
});

modalService.register('workspace-delete', {
  element: 'workspace-delete-modal',
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

/* Add web applets */

resourceModel.register('https://ruperts.world');
resourceModel.register('https://applets.unternet.co/calculator');
