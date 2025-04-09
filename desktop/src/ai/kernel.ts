import { Interpreter, InteractionInput, LanguageModel } from '@unternet/kernel';
import { Workspace, WorkspaceModel } from '../core/workspaces';
import { ConfigModel, ConfigNotification } from '../core/config';
import { AIModelService } from './ai-models';

export interface KernelInit {
  model?: LanguageModel;
  workspaceModel: WorkspaceModel;
  configModel: ConfigModel;
  aiModelService: AIModelService;
}

export class Kernel {
  initialized: boolean = false;
  interpreter: Interpreter | null;
  workspaceModel: WorkspaceModel;
  configModel: ConfigModel;
  aiModelService: AIModelService;

  constructor({ workspaceModel, configModel, aiModelService }: KernelInit) {
    this.workspaceModel = workspaceModel;
    this.configModel = configModel;
    this.aiModelService = aiModelService;
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

    if (!model) {
      this.initialized = false;
      this.interpreter = null;
    } else {
      this.interpreter = new Interpreter({ model, hint });
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
    const output = await this.interpreter.generateResponse(recentInteractions);

    if (output.type === 'text') {
      const outputIndex = this.workspaceModel.addOutput(interaction.id, {
        type: output.type,
        content: '',
      });
      let text = '';
      for await (const chunk of output.textStream) {
        text += chunk;
        this.workspaceModel.updateOutputContent(
          interaction.id,
          outputIndex,
          text
        );
      }
    }
  }
}
