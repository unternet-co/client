import { Interpreter, InteractionInput, LanguageModel } from '@unternet/kernel';
import { workspaceStore } from './stores/workspace-store';
import { Workspace } from './data-types';
import { createModel } from './ext/llm';

export interface KernelInit {
  model: LanguageModel;
}

export class Kernel {
  interpreter: Interpreter;
  workspaceStore = workspaceStore;

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
