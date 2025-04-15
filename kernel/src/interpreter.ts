import { LanguageModel, streamText, generateObject } from 'ai';
import {
  ActionDefinition,
  ActionResponse,
  Interaction,
  InteractionOutput,
  InterpreterResponse,
  Resource,
  TextResponse,
} from './types';
import {
  createActionRecord,
  createMessages,
  decodeActionUri,
  clone,
} from './utils';
import defaultPrompts, { InterpreterPrompts } from './prompts';
import { ActionChoiceObject, actionChoiceSchema, schemas } from './schemas';

interface InterpreterInit {
  model: LanguageModel;
  resources?: Array<Resource>;
  prompts?: InterpreterPrompts;
  hint?: string;
  maxResponses?: number;
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
  async createResponse(
    interactions: Array<Interaction>
  ): Promise<InterpreterResponse | null> {
    // If there are no actions, respond with text
    if (!Object.keys(this.actions).length) {
      return this.createTextResponse(interactions);
    }

    const responseMode = await this.chooseResponseMode(interactions);
    console.log('RESPONSE MODE:', responseMode);

    const previousOutput = interactions.at(-1).outputs.at(-1);

    if (responseMode === 'TEXT') {
      if (previousOutput && previousOutput.type === 'text') return null;
      return this.createTextResponse(interactions);
    }
    if (responseMode === 'TOOL') return this.createActionResponse(interactions);
    return null;
  }

  async chooseResponseMode(interactions: Array<Interaction>) {
    const output = await generateObject({
      model: this.model,
      messages: createMessages(
        interactions,
        this.prompts.chooseResponseMode(this.prompts.responseModes)
      ),
      system: this.prompts.system({ actions: this.actions, hint: this.hint }),
      schema: schemas.responseMode(this.prompts.responseModes),
    });

    console.log({
      messages: createMessages(
        interactions,
        this.prompts.chooseResponseMode(this.prompts.responseModes)
      ),
      system: this.prompts.system({ actions: this.actions, hint: this.hint }),
    });

    const { mode } = output.object as { mode: string };
    return mode;
  }

  async createTextResponse(
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

  /**
   * Generates an action directive in response to the user's query.
   * @param interactions An array of interactions
   * @returns An ActionResponse containing the action directive.
   */
  async createActionResponse(
    interactions: Array<Interaction>
  ): Promise<ActionResponse> {
    const output = await generateObject({
      model: this.model,
      messages: createMessages(interactions, this.prompts.chooseAction()),
      system: this.prompts.system({ actions: this.actions, hint: this.hint }),
      schema: actionChoiceSchema(this.actions),
    });

    const { functions } = output.object as ActionChoiceObject;
    if (!functions || !functions[0]?.id) return null;

    const fn = functions[0];
    const { protocol, resourceId, actionId } = decodeActionUri(fn.id);

    return {
      type: 'action',
      protocol,
      resourceId,
      actionId,
      args: fn.args,
    };
  }
}
