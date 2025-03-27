import { Interpreter, InteractionInput, LanguageModel } from '@unternet/kernel';
import { Workspace, WorkspaceModel } from './models/workspaces';
import { dependencies } from './base/dependencies';

export interface KernelInit {
  model: LanguageModel;
}

export class Kernel {
  interpreter: Interpreter;
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');

  constructor({ model }: KernelInit) {
    this.interpreter = new Interpreter(model);
  }

  async handleInput(workspaceId: Workspace['id'], input: InteractionInput) {
    // Update the lastModifiedAt timestamp whenever a command is issued
    this.workspaceModel.updateLastModified(workspaceId);
    
    const interaction = this.workspaceModel.createInteraction(
      workspaceId,
      input
    );
    const recentInteractions = this.workspaceModel.allInteractions(workspaceId);
    const output = await this.interpreter.generateOutput(recentInteractions);
    console.log('in kernel', interaction);
    this.workspaceModel.addOutput(interaction.id, output);
  }
}
