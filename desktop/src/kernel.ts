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
    const interaction = this.workspaceModel.createInteraction(
      workspaceId,
      input
    );

    const recentInteractions = this.workspaceModel.allInteractions(workspaceId);
    const output = await this.interpreter.generateOutput(recentInteractions);

    if (output.type === 'text') {
      const outputIndex = this.workspaceModel.addOutput(interaction.id, {
        type: output.type,
        content: '',
      });
      let text = '';
      for await (const chunk of output.textStream) {
        console.log(chunk);
        text += chunk;
        this.workspaceModel.updateOutput(interaction.id, outputIndex, {
          content: text,
        });
      }
    }
  }
}
