import { Interpreter, InteractionInput, LanguageModel } from '@unternet/kernel';
import { Workspace, workspaceModel, WorkspaceModel } from './models/workspaces';
import { createModel } from './adapters/llm';

export interface KernelInit {
  model: LanguageModel;
}

export class Kernel {
  interpreter: Interpreter;
  workspaceModel: WorkspaceModel;

  constructor({ model }: KernelInit) {
    this.interpreter = new Interpreter(model);
  }

  async handleInput(input: InteractionInput) {
    const activeWorkspace = workspaceModel.getActiveWorkspace();
    console.log(activeWorkspace);
    if (!activeWorkspace) return;

    const interaction = workspaceModel.createInteraction(
      activeWorkspace.id,
      input
    );
    const recentInteractions = workspaceModel.getInteractions(
      activeWorkspace.id
    );
    const output = await this.interpreter.generateOutput(recentInteractions);
    workspaceModel.addOutput(interaction.id, output);
  }
}

export const kernel = new Kernel({ model: createModel() });
