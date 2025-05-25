import {
  Interpreter,
  ProcessRuntime,
  inputMessage,
  responseMessage,
  KernelResponse,
  DirectResponse,
} from '@unternet/kernel';

import { ConfigNotification, ConfigService } from '../config/config-service';
import { AIModelService } from '../ai/model-service';
import { Notifier } from '../common/notifier';
import { WorkspaceService } from '../workspaces/workspace-service';
import { WorkspaceRecord } from '../workspaces/types';
import { WorkspaceModel } from '../workspaces/workspace-model';
import { MessageService } from '../messages/message-service';
import { stream } from 'glob';

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
  status: KernelStatus;
  workspaceModel: WorkspaceModel | null = null;
  private notifier = new Notifier<KernelNotification>();
  readonly subscribe = this.notifier.subscribe;

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly messageService: MessageService,
    private readonly configService: ConfigService,
    private readonly aiModelService: AIModelService,
    private readonly runtime: ProcessRuntime
  ) {
    this.workspaceModel = this.workspaceService.activeWorkspaceModel;

    this.loadModel();

    this.workspaceService.onActivateWorkspace(({ workspaceModel }) => {
      this.workspaceModel = workspaceModel;
    });

    this.configService.subscribe((notification: ConfigNotification) => {
      if (notification?.type === 'model' || notification?.type === 'hint') {
        this.loadModel();
      }
    });
  }

  async loadModel() {
    const config = this.configService.get('ai');

    const model = this.aiModelService.resolveModel(
      config.primaryModel.provider,
      config.primaryModel.name
    );

    const hint = config.globalHint;
    // const resources = this.resourceModel.all();
    // this.resourceModel.subscribe(this.updateResources.bind(this));
    // this.workspaceModel.subscribe(this.updateResources.bind(this));

    if (!model) {
      this.initialized = false;
      this.interpreter = null;
    } else {
      this.interpreter = new Interpreter({ model, hint });
      this.initialized = true;
    }
  }

  // updateResources() {
  //   const resources = enabledResources(this.resourceModel, this.workspaceModel);
  //   this.interpreter.updateResources(resources);
  // }

  updateStatus(status: KernelStatus) {
    this.status = status;
    this.notifier.notify({ status });
  }

  async handleInput(input: KernelInput) {
    const workspaceId = this.workspaceModel.id;
    const inputMsg = inputMessage({ text: input.text });
    await this.messageService.createMessageForWorkspace(workspaceId, inputMsg);

    if (!this.interpreter || !this.initialized) {
      throw new KernelNotInitializedError(
        'Tried to access kernel when not initialized.'
      );
    }

    const runner = this.interpreter.run(this.workspaceModel.messages);

    let iteration = await runner.next();
    while (!iteration.done) {
      this.updateStatus('thinking');
      const response = iteration.value as KernelResponse;

      switch (response.type) {
        case 'direct':
          await this.handleTextResponse(workspaceId, response);
          break;

        case 'actionproposal':
          // await this.handleActionResponse(workspaceId, response);
          this.updateStatus('idle');
          break;

        default:
          throw new Error('Action type not recognized!');
      }

      iteration = await runner.next(this.workspaceModel.messages);
    }
  }

  async handleTextResponse(
    workspaceId: WorkspaceRecord['id'],
    response: DirectResponse
  ) {
    const message = responseMessage();

    let streamStarted = false;
    let text = '';
    for await (const chunk of response.contentStream) {
      if (!streamStarted) {
        this.updateStatus('responding');
        this.messageService.createMessageForWorkspace(workspaceId, message);
        streamStarted = true;
      }

      text += chunk;
      this.messageService.update(message.id, { text });
    }

    this.updateStatus('idle');
  }

  // async handleActionResponse(
  //   workspaceId: WorkspaceRecord['id'],
  //   proposal: ActionProposalResponse
  // ) {
  //   const { process, content } = await this.runtime.dispatch(proposal);

  //   if (process && proposal.display === 'standalone') {
  //     this.workspaceModel.createProcess(workspaceId, process);
  //   } else {
  //     const message = actionMessage({
  //       uri: proposal.uri,
  //       actionId: proposal.actionId,
  //       args: proposal.args,
  //       display: proposal.display,
  //       content,
  //     });

  //     this.workspaceModel.addMessage(workspaceId, message);
  //   }
  // }
}
