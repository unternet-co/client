import { initTabStoreData, TabModel, TabStoreData } from './deprecated/tabs';
import { MessageRecord } from './messages/types';
import { dependencies } from './common/dependencies';
import { DatabaseService } from './storage/database-service';
import { KeyStoreService } from './storage/keystore-service';
import { ShortcutService } from './shortcuts/shortcut-service';
import { appendEl, createEl } from './common/utils/dom';
import { registerGlobalShortcuts } from './shortcuts/global-shortcuts';
import { ModalService } from './ui/common/modals/modal-service';
import { Kernel } from './kernel/kernel';
import { OpenAIModelProvider } from './ai/providers/openai';
import { OllamaModelProvider } from './ai/providers/ollama';
import { AIModelService } from './ai/models';
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
import './ui/modals/new-workspace-modal';
import { WorkspaceRecord } from './workspaces/types';
import { ProcessRecord, ProcessService } from './processes/process-service';
import { ConfigData, ConfigService, initConfig } from './config/config-service';
import { WorkspaceService } from './workspaces/workspace-service';
import { MessageService } from './messages/message-service';

async function init() {
  /* Initialize databases & stores */

  const workspaceDatabaseService = new DatabaseService<string, WorkspaceRecord>(
    'workspaces'
  );
  // const processDatabaseService = new DatabaseService<string, ProcessRecord>(
  //   'processes'
  // );
  const messageDatabaseService = new DatabaseService<string, MessageRecord>(
    'messages'
  );
  // const resourceDatabaseService = new DatabaseService<string, Resource>(
  //   'resources'
  // );
  const configStore = new KeyStoreService<ConfigData>('config', initConfig);

  /* Initialize model dependencies */

  const runtime = new ProcessRuntime(protocols, {
    processLimit: NUM_CONCURRENT_PROCESSES,
  });

  /* Initialize models */

  // const processService = new ProcessService(processDatabaseService, runtime);
  // await processService.load();
  // dependencies.registerSingleton('ProcessService', processService);

  const configService = new ConfigService(configStore);
  await configService.load();
  dependencies.registerSingleton('ConfigService', configService);

  const messageService = new MessageService(messageDatabaseService);

  const workspaceService = new WorkspaceService(
    workspaceDatabaseService,
    messageService,
    configService
  );
  await workspaceService.load();
  dependencies.registerSingleton('WorkspaceService', workspaceService);

  // const resourceModel = new ResourceModel({
  //   resourceDatabaseService,
  //   initialResources,
  // });
  // await resourceModel.load();
  // dependencies.registerSingleton('ResourceModel', resourceModel);

  /* Initialize kernel & LLMs */

  const openAIModelProvider = new OpenAIModelProvider();
  const ollamaModelProvider = new OllamaModelProvider();
  const aiModelService = new AIModelService({
    openai: openAIModelProvider,
    ollama: ollamaModelProvider,
  });
  dependencies.registerSingleton('AIModelService', aiModelService);

  const kernel = new Kernel(
    workspaceService,
    messageService,
    configService,
    aiModelService,
    runtime
  );
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

  modalService.register('new-workspace', {
    element: 'new-workspace-modal',
  });

  /* Register keyboard shortcuts */

  registerGlobalShortcuts();

  /* Initialize UI */

  appendEl(document.body, createEl('app-root'));

  // Open settings if no model defined
  const config = configService.get();
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
