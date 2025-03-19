import {
  Interpreter,
  Interaction,
  InteractionInput,
  ResourceMap,
  LanguageModel,
} from '@unternet/kernel';

export interface KernelInit {
  model: LanguageModel;
  workspaceStore: workspaceStore;
}

export class Kernel {
  interpreter: Interpreter;
  interactionStore: InteractionStore;
  resources = new ResourceMap();

  constructor({ model, interactionStore }: KernelInit) {
    this.interpreter = new Interpreter(model);
  }

  addInteraction(interaction: Interaction) {
    this.interactions.push(interaction);
    return this.interactions.length - 1;
  }

  async handleInput(input: InteractionInput) {
    const interaction = Interaction.createWithInput(input);
    const interactionId = this.addInteraction(interaction);

    // Get output from the interpreter
    const output = await this.interpreter.generateOutput(
      this.interactions,
      this.resources
    );
    console.log(output);
  }
}
