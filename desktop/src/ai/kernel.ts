import { Interpreter, InteractionInput, LanguageModel } from '@unternet/kernel';
import { Workspace, WorkspaceModel } from '../core/workspaces';

export interface KernelInit {
  model?: LanguageModel;
  workspaceModel: WorkspaceModel;
}

export class Kernel {
  initialized: boolean = false;
  interpreter: Interpreter | null;
  workspaceModel: WorkspaceModel;

  constructor({ model, workspaceModel }: KernelInit) {
    this.workspaceModel = workspaceModel;
    this.updateLanguageModel(model);
  }

  updateLanguageModel(llm: LanguageModel | null, hint?: string) {
    if (!llm) {
      this.initialized = false;
      this.interpreter = null;
    } else {
      this.interpreter = new Interpreter({ model: llm, hint });
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
