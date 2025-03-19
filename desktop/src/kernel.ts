import { Interpreter, InteractionInput, LanguageModel } from '@unternet/kernel';
import { Workspace, workspaceModel, WorkspaceModel } from './models/workspaces';
import { createModel } from './lib/llm';

export interface KernelInit {
  model: LanguageModel;
}

export class Kernel {
  interpreter: Interpreter;
  workspaceModel: WorkspaceModel;

  constructor({ model }: KernelInit) {
    this.interpreter = new Interpreter(model);
  }

  async handleInput(workspaceId: Workspace['id'], input: InteractionInput) {
    const interaction = workspaceModel.createInteraction(workspaceId, input);
    const recentInteractions = workspaceModel.getInteractions(workspaceId);
    const output = await this.interpreter.generateOutput(recentInteractions);
    workspaceModel.addOutput(interaction.id, output);
  }
}

export const kernel = new Kernel({ model: createModel() });
