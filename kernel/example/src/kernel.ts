import { type LanguageModel } from 'ai';
import {
  Interpreter,
  Interaction,
  Dispatcher,
  type InteractionInput,
  Resource,
  ResourceMap,
} from '../../src/index';

interface KernelInit {
  model: LanguageModel;
  resources?: ResourceMap;
}

export class Kernel {
  interpreter: Interpreter;
  dispatcher: Dispatcher;
  interactions: Interaction[] = [];
  resources: ResourceMap;

  constructor({ model, resources }: KernelInit) {
    this.interpreter = new Interpreter(model);
    this.dispatcher = new Dispatcher();
    this.resources = resources || new ResourceMap();
  }

  addInteraction(interaction: Interaction) {
    this.interactions.push(interaction);
    return this.interactions.length - 1;
  }

  async handleInput(input: InteractionInput) {
    const interaction = Interaction.createWithInput(input);
    const interactionId = this.addInteraction(interaction);

    // Get output from the interpreter
    const output = await this.interpreter.generateOutput(this.interactions);
    console.log(output);

    // // Add the output to the interaction
    // this.interactions[interactionIndex].outputs.push(output);

    // if (output.complete) return;
    // if (output.type === 'action') {
    // // Do something with the action, add the action's output, then continue
    // }
  }
}
