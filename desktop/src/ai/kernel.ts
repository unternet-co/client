import {
  Interpreter,
  InteractionInput,
  LanguageModel,
  ActionResponse,
  TextResponse,
  ActionOutput,
  Dispatcher,
  Protocol,
} from '@unternet/kernel';
import { Workspace, WorkspaceModel } from '../workspaces';
import { ConfigModel, ConfigNotification } from '../config';
import { AIModelService } from './ai-models';
import { ResourceModel } from '../processes/resources';
import { Interaction } from './interactions';

export interface KernelInit {
  model?: LanguageModel;
  workspaceModel: WorkspaceModel;
  configModel: ConfigModel;
  aiModelService: AIModelService;
  resourceModel: ResourceModel;
  protocols: Array<Protocol>;
}

export class Kernel {
  initialized: boolean = false;
  interpreter?: Interpreter | null;
  dispatcher: Dispatcher;
  workspaceModel: WorkspaceModel;
  configModel: ConfigModel;
  resourceModel: ResourceModel;
  aiModelService: AIModelService;

  constructor({
    workspaceModel,
    configModel,
    aiModelService,
    resourceModel,
    protocols,
  }: KernelInit) {
    this.workspaceModel = workspaceModel;
    this.configModel = configModel;
    this.aiModelService = aiModelService;
    this.resourceModel = resourceModel;
    this.dispatcher = new Dispatcher(protocols);

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
    const resources = this.resourceModel.resources;

    if (!model) {
      this.initialized = false;
      this.interpreter = null;
    } else {
      this.interpreter = new Interpreter({ model, hint, resources });
      this.initialized = true;
    }
  }

  async handleInput(workspaceId: Workspace['id'], input: InteractionInput) {
    if (!this.interpreter || !this.initialized) {
      throw new Error('Tried to access kernel when not initialized.');
    }

    this.workspaceModel.updateModified(workspaceId);

    const interaction = this.workspaceModel.createInteraction(
      workspaceId,
      input
    );

    const recentInteractions = this.workspaceModel.allInteractions(workspaceId);
    const response =
      await this.interpreter.generateResponse(recentInteractions);

    switch (response.type) {
      case 'text':
        await this.handleTextResponse(interaction, response);
        break;
      case 'action':
        await this.handleActionResponse(interaction, response);
        break;
      default:
        throw new Error('Action type not recognized!');
    }
  }

  async handleTextResponse(interaction: Interaction, response: TextResponse) {
    const outputIndex = this.workspaceModel.addOutput(interaction.id, {
      type: response.type,
      content: '',
    });
    let text = '';
    for await (const chunk of response.textStream) {
      text += chunk;
      this.workspaceModel.updateOutputContent(
        interaction.id,
        outputIndex,
        text
      );
    }
  }

  async handleActionResponse(
    interaction: Interaction,
    response: ActionResponse
  ) {
    console.log('it an action');
    const output: ActionOutput = {
      type: 'action',
      directive: response.directive,
      content: {},
    };

    output.content = await this.dispatcher.dispatch(response.directive);
    this.workspaceModel.addOutput(interaction.id, output);
  }
}
