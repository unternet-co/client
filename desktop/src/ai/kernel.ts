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
import { ConfigModel, ConfigNotification } from '../config';
import { AIModelService } from './ai-models';
import { ResourceModel } from '../resources/resource-model';
import { Notifier } from '../common/notifier';
import { ProcessModel } from '../models/process-model';

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
  interpreter?: Interpreter | null;
  runtime: ProcessRuntime;
  workspaceModel: WorkspaceModel;
  configModel: ConfigModel;
  processModel: ProcessModel;
  resourceModel: ResourceModel;
  aiModelService: AIModelService;
  status: KernelStatus;
  private notifier = new Notifier<KernelNotification>();
  readonly subscribe = this.notifier.subscribe;

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

    this.configModel.subscribe(async (notification: ConfigNotification) => {
      if (!notification) return;
      if (notification.type === 'model' || notification.type === 'hint') {
        this.initialize();
      }
    });
  }

  async initialize() {
    const config = this.configModel.get();

    const model = await this.aiModelService.getModel(
      config.ai.primaryModel.provider,
      config.ai.primaryModel.name,
      config.ai.providers[config.ai.primaryModel.provider]
    );

    const hint = config.ai.globalHint;
    const resources = this.resourceModel.all();
    this.resourceModel.subscribe(this.updateResources.bind(this));

    if (!model) {
      this.initialized = false;
      this.interpreter = null;
    } else {
      this.interpreter = new Interpreter({ model, hint, resources });
      this.initialized = true;
    }
  }

  updateResources() {
    const resources = this.resourceModel.all();
    this.interpreter.updateResources(resources);
  }

  updateStatus(status: KernelStatus) {
    this.status = status;
    this.notifier.notify({ status });
  }

  async handleInput(workspaceId: WorkspaceRecord['id'], input: KernelInput) {
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

    this.updateStatus('thinking');

    const runner = this.interpreter.run(
      this.workspaceModel.get(workspaceId).activeMessages
    );

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

      iteration = await runner.next(
        this.workspaceModel.get(workspaceId).activeMessages
      );
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
    const { process, content } = await this.runtime.dispatch(proposal);
    let container: ProcessContainer;
    if (process) container = this.processModel.create(process, workspaceId);

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
