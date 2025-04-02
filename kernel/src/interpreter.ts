import { LanguageModel, streamText, generateObject, jsonSchema } from 'ai';
import {
  ActionDefinition,
  Interaction,
  InterpreterResponse,
  Resource,
  Strategy,
  StrategyCallbackOptions,
  StringEnum,
} from './types.js';
import {
  createActions,
  createMessages,
  createStrategyRecord,
  decodeActionUri,
} from './utils.js';
import { prompts } from './prompts.js';
import { z } from 'zod';
import { ActionChoiceObject, actionChoiceSchema } from './schemas.js';

const textStrategy: Strategy = {
  name: 'text',
  description: `Respond with a straight text response. This is appropriate for simple queries that you can provide a definitive answer to, where no research or tool use is needed, or when the prompt is a creative one or a trivial & non-controversial question.`,
  callback: function ({ interactions, model }): InterpreterResponse {
    const output = streamText({
      model,
      messages: createMessages(interactions),
    });

    return {
      type: 'text',
      text: output.text,
      textStream: output.textStream,
    };
  },
};

const actionStrategy: Strategy = {
  name: 'function',
  description: `Use this when you need additional information from one of the provided functions, or the user has asked you to perform an action not generate a response.`,
  callback: async function ({ interactions, actions, model }) {
    const output = await generateObject({
      model,
      messages: createMessages(interactions),
      schema: actionChoiceSchema(actions),
    });

    const { functions } = output.object as ActionChoiceObject;

    if (!functions || !functions[0].id) return null;

    const { protocol, resourceUri, actionId } = decodeActionUri(
      functions[0].id
    );

    return {
      type: 'action',
      uri: resourceUri,
      protocol,
      actionId,
    };
  },
};

interface InterpreterInit {
  model: LanguageModel;
  resources?: Array<Resource>;
}

export class Interpreter {
  model: LanguageModel;
  actions: Record<string, ActionDefinition> = {};

  strategies: Record<string, Strategy> = createStrategyRecord(
    textStrategy,
    actionStrategy
  );

  constructor({ model, resources }: InterpreterInit) {
    this.model = model;
    this.actions = createActions(resources || []);
  }

  async generateOutput(
    interactions: Array<Interaction>
  ): Promise<InterpreterResponse | null> {
    const strategy = await this.chooseStrategy(interactions);

    console.log('Chose strategy', strategy);

    if (strategy in this.strategies) {
      return this.strategies[strategy].callback({
        interactions,
        actions: this.actions,
        model: this.model,
      });
    }

    return null;
  }

  private async chooseStrategy(interactions: Array<Interaction>) {
    const prompt = prompts.chooseStrategy(this.actions, this.strategies);
    const response = await generateObject({
      model: this.model,
      messages: createMessages(interactions, prompt),
      schema: z.object({
        strategy: z.enum(Object.keys(this.strategies) as StringEnum),
      }),
    });

    return response.object.strategy;
  }
}
