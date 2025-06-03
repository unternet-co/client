import {
  Interpreter,
  LanguageModel,
  ProcessRuntime,
  inputMessage,
  actionMessage,
  responseMessage,
  KernelResponse,
  DirectResponse,
  ActionProposalResponse,
  ProcessContainer,
} from '@unternet/kernel';

import { WorkspaceRecord, WorkspaceModel } from '../models/workspace-model';
import { ConfigModel, ConfigNotification } from '../models/config-model';
import { AIModelService, AIModelProviderConfig } from './ai-models';
import { ResourceModel } from '../models/resource-model';
import { Notifier } from '../common/notifier';
import { ProcessModel } from '../models/process-model';
import { enabledResources } from '../common/utils/resources';

export interface KernelInit {
  model?: LanguageModel;
  workspaceModel: WorkspaceModel;
  configModel: ConfigModel;
  aiModelService: AIModelService;
  resourceModel: ResourceModel;
  runtime: ProcessRuntime;
  processModel: ProcessModel;
}

export interface KernelInput {
  text: string;
}

export class KernelNotInitializedError extends Error {
  name = 'KernelNotInitialized';
}

export type KernelStatus = 'idle' | 'thinking' | 'responding';

export interface KernelNotification {
  status: KernelStatus;
}

export class Kernel {
  initialized: boolean = false;
  interpreter: Interpreter | null = null;
  runtime: ProcessRuntime;
  workspaceModel: WorkspaceModel;
  configModel: ConfigModel;
  processModel: ProcessModel;
  resourceModel: ResourceModel;
  aiModelService: AIModelService;
  status: KernelStatus = 'idle';
  private notifier = new Notifier<KernelNotification>();
  readonly subscribe = this.notifier.subscribe;
  private lastResourceCounts = { total: 0, enabled: 0 };

  constructor({
    workspaceModel,
    configModel,
    aiModelService,
    resourceModel,
    processModel,
    runtime,
  }: KernelInit) {
    this.workspaceModel = workspaceModel;
    this.configModel = configModel;
    this.aiModelService = aiModelService;
    this.resourceModel = resourceModel;
    this.runtime = runtime;
    this.processModel = processModel;

    this.initialize();

    this.configModel.subscribe((notification?: ConfigNotification) => {
      if (!notification) return;
      if (notification.type === 'model' || notification.type === 'hint') {
        this.initialize();
      }
    });
  }

  async initialize() {
    const config = this.configModel.get();
    const primaryModel = config.ai.primaryModel;

    if (!primaryModel) {
      this.initialized = false;
      this.interpreter = null;
      return;
    }

    if (!(primaryModel.provider in config.ai.providers)) {
      console.error(`Provider ${primaryModel.provider} not found in config`);
      this.initialized = false;
      this.interpreter = null;
      return;
    }

    const provider = config.ai.providers[primaryModel.provider];
    if (!provider || typeof provider !== 'object') {
      console.error(`Provider config for ${primaryModel.provider} is invalid`);
      this.initialized = false;
      this.interpreter = null;
      return;
    }

    const model = await this.aiModelService.getModel(
      primaryModel.provider,
      primaryModel.name,
      provider as AIModelProviderConfig
    );

    const hint =
      (config.ai.globalHint || '') +
      '\n\nWhen working with files and directories, use the RESEARCH strategy to first list the contents of a directory before attempting to read specific files. This ensures you have the correct file path before attempting to read it.';
    const resources = this.resourceModel.all();
    this.resourceModel.subscribe(this.updateResources.bind(this));
    this.workspaceModel.subscribe(this.updateResources.bind(this));

    if (!model) {
      this.initialized = false;
      this.interpreter = null;
    } else {
      this.interpreter = new Interpreter({ model, hint, resources });
      this.initialized = true;
    }
  }

  updateResources() {
    const resources = enabledResources(this.resourceModel, this.workspaceModel);
    const totalResources = this.resourceModel.all().length;

    if (
      totalResources !== this.lastResourceCounts.total ||
      resources.length !== this.lastResourceCounts.enabled
    ) {
      console.log('[KERNEL] Resources updated:', {
        totalResources,
        enabledCount: resources.length,
      });
      this.lastResourceCounts = {
        total: totalResources,
        enabled: resources.length,
      };
    }

    if (this.interpreter) {
      this.interpreter.updateResources(resources);
    }
  }

  updateStatus(status: KernelStatus) {
    this.status = status;
    this.notifier.notify({ status });
  }

  async handleInput(workspaceId: WorkspaceRecord['id'], input: KernelInput) {
    console.log('[KERNEL] Processing input:', {
      workspaceId,
      enabledResourceCount: enabledResources(
        this.resourceModel,
        this.workspaceModel
      ).length,
    });

    const inputMsg = inputMessage({ text: input.text });
    this.workspaceModel.addMessage(workspaceId, inputMsg);

    if (!this.interpreter || !this.initialized) {
      this.workspaceModel.addMessage(
        workspaceId,
        responseMessage({
          text: `⚠️ No model is configured. Please select a model in the settings.`,
        })
      );

      throw new KernelNotInitializedError(
        'Tried to access kernel when not initialized.'
      );
    }

    const messages = this.workspaceModel.get(workspaceId).activeMessages;
    if (!messages) {
      throw new Error('No active messages found in workspace');
    }

    const runner = this.interpreter.run(messages);

    let iteration = await runner.next();
    while (!iteration.done) {
      this.updateStatus('thinking');
      const response = iteration.value as KernelResponse;
      switch (response.type) {
        case 'direct':
          this.updateStatus('responding');
          await this.handleTextResponse(workspaceId, response);
          this.updateStatus('idle');
          break;
        case 'actionproposal':
          await this.handleActionResponse(workspaceId, response);
          this.updateStatus('idle');
          break;
        default:
          throw new Error('Action type not recognized!');
      }

      const nextMessages = this.workspaceModel.get(workspaceId).activeMessages;
      if (!nextMessages) {
        throw new Error('No active messages found in workspace');
      }
      iteration = await runner.next(nextMessages);
    }
  }

  async handleTextResponse(
    workspaceId: WorkspaceRecord['id'],
    response: DirectResponse
  ) {
    const message = responseMessage();
    this.workspaceModel.addMessage(workspaceId, message);

    let text = '';
    for await (const chunk of response.contentStream) {
      text += chunk;
      this.workspaceModel.updateMessage(message.id, { text });
    }
  }

  async handleActionResponse(
    workspaceId: WorkspaceRecord['id'],
    proposal: ActionProposalResponse
  ) {
    console.log('[KERNEL] Processing action:', {
      actionId: proposal.actionId,
      uri: proposal.uri,
    });

    const { process, content } = await this.runtime.dispatch(proposal);

    let container: ProcessContainer | undefined;
    if (process) {
      container = this.processModel.create(process, workspaceId);
    }

    const message = actionMessage({
      uri: proposal.uri,
      actionId: proposal.actionId,
      args: proposal.args,
      process: container,
      display: proposal.display,
      content,
    });

    this.workspaceModel.addMessage(workspaceId, message);
  }
}
