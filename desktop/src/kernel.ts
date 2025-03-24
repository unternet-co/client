import { Interpreter, InteractionInput, LanguageModel } from '@unternet/kernel';
import { Workspace, WorkspaceModel } from './models/workspaces';
import { dependencies } from './base/dependencies';

export interface KernelInit {
  model: LanguageModel;
}

export class Kernel {
  interpreter: Interpreter;
  workspaceModel: WorkspaceModel;

  constructor({ model }: KernelInit) {
    this.workspaceModel = dependencies.resolve('WorkspaceModel');
    this.interpreter = new Interpreter(model);
  }

  async handleInput(workspaceId: Workspace['id'], input: InteractionInput) {
    const interaction = this.workspaceModel.createInteraction(
      workspaceId,
      input
    );
    const recentInteractions = this.workspaceModel.getInteractions(workspaceId);
    const output = await this.interpreter.generateOutput(recentInteractions);
    this.workspaceModel.addOutput(interaction.id, output);
  }
}
