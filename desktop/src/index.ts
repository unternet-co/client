import { MessageRecord } from './messages/types';
import { dependencies } from './common/dependencies';
import { DatabaseService } from './storage/database-service';
import { appendEl, createEl } from './common/utils/dom';
import { Kernel } from './kernel/kernel';
import { OpenAIModelProvider } from './ai/providers/openai';
import { OllamaModelProvider } from './ai/providers/ollama';
import { AIModelService } from './ai/model-service';
import { ProcessRuntime, Resource } from '@unternet/kernel';
import { protocols } from './protocols';
import { INIT_RESOURCES, NUM_CONCURRENT_PROCESSES } from './constants';
import { WorkspaceRecord } from './workspaces/workspace-model';
import { ConfigService } from './config/config-service';
import { WorkspaceService } from './workspaces/workspace-service';
import { MessageService } from './messages/message-service';
import { ProcessService } from './processes/process-service';
import { ProcessRecord } from './processes/types';
import {
  initialResources,
  ResourceService,
} from './resources/resource-service';
import './ui/app-root';

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

  /* Initialize model dependencies */

  const runtime = new ProcessRuntime(protocols, {
    processLimit: NUM_CONCURRENT_PROCESSES,
  });

  /* Initialize models */

  const processService = new ProcessService(processDatabaseService, runtime);
  await processService.load();
  dependencies.registerSingleton('ProcessService', processService);

  const configService = new ConfigService();
  await configService.load();
  dependencies.registerSingleton('ConfigService', configService);

  const messageService = new MessageService(messageDatabaseService);

  const workspaceService = new WorkspaceService(
    workspaceDatabaseService,
    messageService,
    configService,
    processService
  );
  await workspaceService.load();
  dependencies.registerSingleton('WorkspaceService', workspaceService);
  const resourceService = new ResourceService({
    resourceDatabaseService,
    initialResources,
  });
  await resourceService.load();
  dependencies.registerSingleton('ResourceService', resourceService);

  /* Add initial resources */

  for (const uri of INIT_RESOURCES) {
    resourceService.register(uri);
  }

  /* Initialize kernel & LLMs */

  const openAIModelProvider = new OpenAIModelProvider();
  const ollamaModelProvider = new OllamaModelProvider();
  const aiModelService = new AIModelService(configService, {
    openai: openAIModelProvider,
    ollama: ollamaModelProvider,
  });
  dependencies.registerSingleton('AIModelService', aiModelService);

  const kernel = new Kernel(
    workspaceService,
    messageService,
    configService,
    aiModelService,
    resourceService,
    processService,
    runtime
  );
  dependencies.registerSingleton('Kernel', kernel);

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
  }
}

init().catch((error) => {
  console.error('Failed to initialize application:', error);
});
