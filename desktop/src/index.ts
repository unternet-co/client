import { initTabStoreData, TabModel, TabStoreData } from './tabs';
import { MessageRecord } from './messages';
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
import { ResourceModel, initialResources } from './protocols/resources';
import { protocols } from './protocols/protocols';
import './ui/common/styles/global.css';
import './ui/common/styles/reset.css';
import './ui/common/styles/markdown.css';
import './modals/global/settings-modal';
import './ui/app-root';
import { ProcessModel, SerializedProcess } from './processes';
import { ProcessRuntime } from '@unternet/kernel';
import './modals/global/bug-modal';
import './ui/workspaces/workspace-settings-modal';

/* Initialize databases & stores */

const workspaceDatabaseService = new DatabaseService<string, Workspace>(
  'workspaces'
);
const processDatabaseService = new DatabaseService<string, SerializedProcess>(
  'processes'
);
const messageDatabaseService = new DatabaseService<string, MessageRecord>(
  'messages'
);
const tabKeyStore = new KeyStoreService<TabStoreData>('tabs', initTabStoreData);
const configStore = new KeyStoreService<ConfigData>('config', initConfig);

/* Initialize model dependencies */

const runtime = new ProcessRuntime(protocols);
console.log(runtime.protocols);

/* Initialize models */

const processModel = new ProcessModel(processDatabaseService, runtime);
dependencies.registerSingleton('ProcessModel', ProcessModel);

const workspaceModel = new WorkspaceModel(
  workspaceDatabaseService,
  messageDatabaseService,
  processModel
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
  title: 'Settings',
  element: 'settings-modal',
});

modalService.register('bug', {
  title: 'Report a bug',
  element: 'bug-modal',
});

modalService.register('workspace-settings', {
  title: 'Workspace Settings',
  element: 'workspace-settings-modal',
  modal: false,
  position: 'right',
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
