import { Interpreter, InteractionInput, LanguageModel } from '@unternet/kernel';
<<<<<<< Updated upstream
import { Workspace, workspaceStore, workspaceStore } from './models/workspaces';
import { createModel } from './adapters/llm';
=======
import { Workspace, workspaceStore, workspaceStore } from './stores/workspaces';
import { createModel } from './integrations/llm';
>>>>>>> Stashed changes

export interface KernelInit {
  model: LanguageModel;
}

export class Kernel {
  interpreter: Interpreter;
  workspaceStore: workspaceStore;

  constructor({ model }: KernelInit) {
    this.interpreter = new Interpreter(model);
  }

  async handleInput(workspaceId: Workspace['id'], input: InteractionInput) {
    const interaction = workspaceStore.createInteraction(workspaceId, input);
    const recentInteractions = workspaceStore.getInteractions(workspaceId);
    const output = await this.interpreter.generateOutput(recentInteractions);
    workspaceStore.addOutput(interaction.id, output);
  }
}

export const kernel = new Kernel({ model: createModel() });
