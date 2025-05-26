import {
  Interpreter,
  ProcessRuntime,
  inputMessage,
  responseMessage,
  thoughtMessage,
  logMessage,
  KernelResponse,
  DirectResponse,
  ActionProposalResponse,
} from '@unternet/kernel';

import { ConfigNotification, ConfigService } from '../config/config-service';
import { AIModelService } from '../ai/model-service';
import { Notifier } from '../common/notifier';
import { WorkspaceService } from '../workspaces/workspace-service';
import { WorkspaceRecord } from '../workspaces/workspace-model';
import { WorkspaceModel } from '../workspaces/workspace-model';
import { MessageService } from '../messages/message-service';
import { ResourceService } from '../resources/resource-service';
import { ProcessService } from '../processes/process-service';
import { isValidURL, uriWithScheme } from '../common/utils/http';
import { WebProcess } from '../protocols/http/processes';

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
    private readonly resourceService: ResourceService,
    private readonly processService: ProcessService,
    private readonly runtime: ProcessRuntime
  ) {
    this.resourceService.subscribe(this.updateResources.bind(this));
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
    let model = null;

    if (config?.primaryModel) {
      model = this.aiModelService.resolveModel(
        config.primaryModel.provider,
        config.primaryModel.name
      );
    }

    this.initialized = !!model;
    this.interpreter = model
      ? new Interpreter({
          model,
          resources: this.resourceService.all(),
        })
      : null;
  }

  updateResources() {
    this.interpreter?.updateResources(this.resourceService.all());
  }

  updateStatus(status: KernelStatus) {
    this.status = status;
    this.notifier.notify({ status });
  }

  async handleInput(input: KernelInput) {
    this.updateStatus('thinking');
    const workspaceId = this.workspaceModel.id;
    const inputMsg = inputMessage({ text: input.text });
    await this.messageService.createMessageForWorkspace(workspaceId, inputMsg);

    // Check if the input is a valid URL and spawn a web process directly
    if (isValidURL(input.text)) {
      const url = uriWithScheme(input.text);
      try {
        const webProcess = await WebProcess.create(url);
        const container = await this.processService.spawn(webProcess);
        this.workspaceModel.attachProcess(container);
        this.updateStatus('idle');
        return;
      } catch (error) {
        console.error('Failed to create web process:', error);
        // Fall through to normal interpreter handling if web process creation fails
      }
    }

    if (!this.interpreter || !this.initialized) {
      throw new KernelNotInitializedError(
        'Tried to access kernel when not initialized.'
      );
    }

    const runner = this.interpreter.run({
      messages: this.workspaceModel.messages,
      processes: this.workspaceModel.processes,
    });

    let iteration = await runner.next();
    while (!iteration.done) {
      this.updateStatus('thinking');
      const response = iteration.value as KernelResponse;

      switch (response.type) {
        case 'direct':
          await this.handleTextResponse(workspaceId, response);
          this.updateStatus('idle');
          break;

        case 'actionproposal':
          await this.handleActionResponse(workspaceId, response);
          this.updateStatus('idle');
          break;

        case 'thought':
          console.log('Thought response:', response);
          const thoughtMsg = thoughtMessage({ text: response.content });
          this.messageService.createMessageForWorkspace(
            workspaceId,
            thoughtMsg
          );
          this.updateStatus('idle');
          break;

        case 'log':
          console.log(response.content);
          const logMsg = logMessage({ text: response.content });
          this.messageService.createMessageForWorkspace(workspaceId, logMsg);
          this.updateStatus('idle');
          break;
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
  }

  async handleActionResponse(
    workspaceId: WorkspaceRecord['id'],
    proposal: ActionProposalResponse
  ) {
    const { process, content } = await this.runtime.dispatch(proposal);

    // if (process && proposal.display === 'standalone') {
    if (process) {
      const container = await this.processService.spawn(process);
      this.workspaceModel.attachProcess(container);
    }

    // } else {
    //   const message = actionMessage({
    //     uri: proposal.uri,
    //     actionId: proposal.actionId,
    //     args: proposal.args,
    //     display: proposal.display,
    //     content,
    //   });
  }
}
