import {
  Interpreter,
  LanguageModel,
  ActionResponse,
  TextResponse,
  ProcessRuntime,
  Protocol,
  inputMessage,
  InterpreterResponse,
  actionMessage,
  responseMessage,
} from '@unternet/kernel';
import { Workspace, WorkspaceModel } from '../workspaces';
import { ConfigModel, ConfigNotification } from '../config';
import { AIModelService } from './ai-models';
import { ResourceModel } from '../protocols/resources';
import { Notifier } from '../common/notifier';

export interface KernelInit {
  model?: LanguageModel;
  workspaceModel: WorkspaceModel;
  configModel: ConfigModel;
  aiModelService: AIModelService;
  resourceModel: ResourceModel;
  runtime: ProcessRuntime;
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
    runtime,
  }: KernelInit) {
    this.workspaceModel = workspaceModel;
    this.configModel = configModel;
    this.aiModelService = aiModelService;
    this.resourceModel = resourceModel;
    this.runtime = runtime;

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

    if (!model) {
      this.initialized = false;
      this.interpreter = null;
    } else {
      this.interpreter = new Interpreter({ model, hint, resources });
      this.initialized = true;
    }
  }

  updateStatus(status: KernelStatus) {
    this.status = status;
    this.notifier.notify({ status });
  }

  async handleInput(workspaceId: Workspace['id'], input: KernelInput) {
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
      this.workspaceModel.allMessages(workspaceId)
    );

    let iteration = await runner.next();
    while (!iteration.done) {
      this.updateStatus('thinking');
      const response = iteration.value as InterpreterResponse;
      switch (response.type) {
        case 'text':
          this.updateStatus('responding');
          await this.handleTextResponse(workspaceId, response);
          this.updateStatus('idle');
          break;
        case 'action':
          await this.handleActionResponse(workspaceId, response);
          this.updateStatus('idle');
          break;
        default:
          throw new Error('Action type not recognized!');
      }

      iteration = await runner.next(
        this.workspaceModel.allMessages(workspaceId)
      );
    }
  }

  async handleTextResponse(
    workspaceId: Workspace['id'],
    response: TextResponse
  ) {
    const message = responseMessage();
    this.workspaceModel.addMessage(workspaceId, message);

    let text = '';
    for await (const chunk of response.textStream) {
      text += chunk;
      this.workspaceModel.updateMessage(message.id, { text });
    }
  }

  async handleActionResponse(
    workspaceId: Workspace['id'],
    response: ActionResponse
  ) {
    const { process, content } = await this.runtime.dispatch(
      response.directive
    );

    const message = actionMessage({
      directive: response.directive,
      process,
      content,
    });

    this.workspaceModel.addMessage(workspaceId, message);
  }
}
