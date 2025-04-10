import { LanguageModel, streamText, generateObject, jsonSchema } from 'ai';
import {
  ActionDefinition,
  ActionDirective,
  Interaction,
  InterpreterResponse,
  Resource,
  TextResponse,
} from './types';
import { createActionRecord, createMessages, decodeActionUri } from './utils';
import defaultPrompts, { InterpreterPrompts } from './prompts';
import { ActionChoiceObject, actionChoiceSchema } from './schemas';

interface InterpreterInit {
  model: LanguageModel;
  resources?: Array<Resource>;
  prompts?: InterpreterPrompts;
  hint?: string;
}

export class Interpreter {
  model: LanguageModel;
  actions: Record<string, ActionDefinition> = {};
  prompts: InterpreterPrompts;
  hint: string;

  constructor({ model, resources, prompts, hint }: InterpreterInit) {
    this.model = model;
    this.hint = hint;
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
  ): Promise<InterpreterResponse | null> {
    const textAction = { description: this.prompts.textActionDescription };
    const directive = await this.createDirective(interactions, {
      ...{ text: textAction },
      ...this.actions,
    });

    if (!directive) {
      return null;
    } else if (directive.protocol === 'text') {
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
  ): Promise<ActionDirective | null> {
    const output = await generateObject({
      model: this.model,
      messages: createMessages(
        interactions,
        this.prompts.chooseAction(actions)
      ),
      system: this.prompts.system({ hint: this.hint }),
      schema: actionChoiceSchema(actions),
    });

    const { functions } = output.object as ActionChoiceObject;
    if (!functions || !functions[0]?.id) {
      // Ollama (qwen2.5-coder) returns an object with a `text` property
      if ('text' in (output.object as any)) return { protocol: 'text' };

      // Object generation is most likely not supported by the model used
      return null;
    }

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
      system: this.prompts.system({ actions: this.actions, hint: this.hint }),
      messages: createMessages(interactions),
    });

    return {
      type: 'text',
      text: output.text,
      textStream: output.textStream,
    };
  }
}
