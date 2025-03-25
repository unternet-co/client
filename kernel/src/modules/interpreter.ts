import { generateText, type LanguageModel } from 'ai';
import { Interaction, type InteractionOutput } from './interactions.js';
import { Resource, ResourceMap } from './resources.js';

export class Interpreter {
  model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  async generateOutput(
    interactions: Array<Interaction>,
    resources?: ResourceMap
  ): Promise<InteractionOutput> {
    const tools = Resource.toTools(resources);

    const outputs = await generateText({
      model: this.model,
      messages: Interaction.toMessages(interactions),
      tools: tools,
    });

    return Interaction.createTextOutput(outputs.text);
  }
}
