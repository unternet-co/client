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
import {
  ConfigData,
  ConfigModel,
  ConfigNotification,
  initConfig,
} from './core/config';
import { Kernel } from './ai/kernel';
import { OpenAIModelProvider } from './ai/providers/openai';
import { OllamaModelProvider } from './ai/providers/ollama';
import { AIModelService } from './ai/ai-models';
import './ui/common/styles/global.css';
import './ui/common/styles/reset.css';
import './ui/common/styles/markdown.css';
import './ui/modals/settings-modal';
import './ui/modals/delete-workspace-modal';
import './ui/app-root';

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

/* Initialize kernel & LLMs */

const openAIModelProvider = new OpenAIModelProvider();
const ollamaModelProvider = new OllamaModelProvider();
const aiModelService = new AIModelService({
  openai: openAIModelProvider,
  ollama: ollamaModelProvider,
  anthropic: null,
});
dependencies.registerSingleton('AIModelService', aiModelService);

const kernel = new Kernel({ model: null, workspaceModel });
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

modalService.register('delete-workspace', {
  title: 'Delete Workspace',
  element: 'delete-workspace-modal',
});

/* Register keyboard shortcuts */

registerGlobalShortcuts();

/* Cross-service processes */

// TODO: Extract this into a new service
async function updateKernelModel() {
  const config = configModel.get();
  const model = await aiModelService.getModel(
    config.ai.primaryModel.provider,
    config.ai.primaryModel.name,
    config.ai.providers[config.ai.primaryModel.provider]
  );
  kernel.updateLanguageModel(model);
}

configModel.subscribe(async (notification: ConfigNotification) => {
  if (notification && notification.type === 'model') {
    updateKernelModel();
  }
});

updateKernelModel();

/* Initialize UI */

appendEl(document.body, createEl('app-root'));
