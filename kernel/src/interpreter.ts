import { LanguageModel, streamText, generateObject, jsonSchema } from 'ai';
import {
  ActionDefinition,
  ActionDirective,
  Interaction,
  InterpreterResponse,
  Resource,
  TextResponse,
} from './types.js';
import {
  createActionRecord,
  createMessages,
  decodeActionUri,
} from './utils.js';
import defaultPrompts, { InterpreterPrompts } from './prompts.js';
import { ActionChoiceObject, actionChoiceSchema } from './schemas.js';

interface InterpreterInit {
  model: LanguageModel;
  resources?: Array<Resource>;
  prompts?: InterpreterPrompts;
}

export class Interpreter {
  model: LanguageModel;
  actions: Record<string, ActionDefinition> = {};
  prompts: InterpreterPrompts;

  constructor({ model, resources, prompts }: InterpreterInit) {
    this.model = model;
    this.actions = createActionRecord(resources || []);
    this.prompts = { ...defaultPrompts, ...prompts };
  }

  /**
   * Generates a response to the user's query, which can be either text or an action call.
   * @param interactions An array of interactions
   * @returns An InterpreterResponse object, of type 'text' or 'action'.
   */
  async generateResponse(
    interactions: Array<Interaction>
  ): Promise<InterpreterResponse> {
    const textAction = { description: this.prompts.textActionDescription };
    const directive = await this.createDirective(interactions, {
      ...{ text: textAction },
      ...this.actions,
    });

    if (directive.protocol === 'text') {
      return this.createTextResponse(interactions);
    } else {
      return {
        type: 'action',
        directive,
      };
    }
  }

  /**
   * Generates an action directive in response to the user's query. Does not handle text generation.
   * @param interactions An array of interactions
   * @returns An ActionDirective promise based on the interpreter's resources.
   */
  async generateDirective(
    interactions: Array<Interaction>
  ): Promise<ActionDirective> {
    return this.createDirective(interactions, this.actions);
  }

  private async createDirective(
    interactions: Array<Interaction>,
    actions: Record<string, ActionDefinition>
  ): Promise<ActionDirective> {
    const output = await generateObject({
      model: this.model,
      messages: createMessages(
        interactions,
        this.prompts.chooseAction(actions)
      ),
      schema: actionChoiceSchema(actions),
    });

    const { functions } = output.object as ActionChoiceObject;
    if (!functions || !functions[0]?.id) return null;

    const fn = functions[0];
    const { protocol, resourceId, actionId } = decodeActionUri(fn.id);

    return {
      protocol,
      resourceId,
      actionId,
      args: fn.args,
    };
  }

  private async createTextResponse(
    interactions: Array<Interaction>
  ): Promise<TextResponse> {
    const output = streamText({
      model: this.model,
      system: this.prompts.system({ actions: this.actions }),
      messages: createMessages(interactions),
    });

    return {
      type: 'text',
      text: output.text,
      textStream: output.textStream,
    };
  }
}
