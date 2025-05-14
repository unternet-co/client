import { initTabStoreData, TabModel, TabStoreData } from './deprecated/tabs';
import { MessageRecord } from './models/message-model';
import { WorkspaceRecord, WorkspaceModel } from './models/workspace-model';
import { dependencies } from './common/dependencies';
import { DatabaseService } from './storage/database-service';
import { KeyStoreService } from './storage/keystore-service';
import { ShortcutService } from './shortcuts/shortcut-service';
import { appendEl, createEl } from './common/utils/dom';
import { registerGlobalShortcuts } from './shortcuts/global-shortcuts';
import { ModalService } from './modals/modal-service';
import { ConfigData, ConfigModel, initConfig } from './models/config-model';
import { Kernel } from './ai/kernel';
import { OpenAIModelProvider } from './ai/providers/openai';
import { OllamaModelProvider } from './ai/providers/ollama';
import { AIModelService } from './ai/ai-models';
import { ResourceModel, initialResources } from './models/resource-model';
import { ProcessModel, ProcessRecord } from './models/process-model';
import { ProcessRuntime, Resource } from '@unternet/kernel';
import { protocols } from './protocols';
import { NUM_CONCURRENT_PROCESSES } from './constants';
import './ui/common/styles/global.css';
import './ui/common/styles/reset.css';
import './ui/common/styles/markdown.css';
import './ui/modals/settings-modal/index';
import './ui/app-root';
import './ui/modals/bug-modal';
import './ui/modals/workspace-delete-modal';

async function init() {
  /* Initialize databases & stores */

  const workspaceDatabaseService = new DatabaseService<string, WorkspaceRecord>(
    'workspaces'
  );
  const processDatabaseService = new DatabaseService<string, ProcessRecord>(
    'processes'
  );
  const messageDatabaseService = new DatabaseService<string, MessageRecord>(
    'messages'
  );
  const resourceDatabaseService = new DatabaseService<string, Resource>(
    'resources'
  );
  const configStore = new KeyStoreService<ConfigData>('config', initConfig);

  /* Initialize model dependencies */

  const runtime = new ProcessRuntime(protocols, {
    processLimit: NUM_CONCURRENT_PROCESSES,
  });

  /* Initialize models */

  const processModel = new ProcessModel(processDatabaseService, runtime);
  await processModel.load();
  dependencies.registerSingleton('ProcessModel', ProcessModel);

  const configModel = new ConfigModel(configStore);
  await configModel.load();
  dependencies.registerSingleton('ConfigModel', configModel);

  const workspaceModel = new WorkspaceModel(
    workspaceDatabaseService,
    messageDatabaseService,
    processModel,
    configModel
  );
  await workspaceModel.load();
  dependencies.registerSingleton('WorkspaceModel', workspaceModel);

  const resourceModel = new ResourceModel({
    resourceDatabaseService,
    initialResources,
  });
  await resourceModel.load();
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
    processModel,
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
}

// Call the init function to start the application
init().catch((error) => {
  console.error('Failed to initialize application:', error);
});
