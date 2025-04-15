import { LanguageModel, streamText, generateObject } from 'ai';
import {
  ActionDefinition,
  ActionDirective,
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
import { ActionChoiceObject, actionChoiceSchema } from './schemas';

interface InterpreterInit {
  model: LanguageModel;
  resources?: Array<Resource>;
  prompts?: InterpreterPrompts;
  hint?: string;
  maxResponses?: number;
}

interface ExtendedActionsOpts {
  text?: boolean;
  stop?: boolean;
}

export class Interpreter {
  model: LanguageModel;
  actions: Record<string, ActionDefinition> = {};
  prompts: InterpreterPrompts;
  hint: string;
  maxResponses = 3;

  constructor({
    model,
    resources,
    prompts,
    hint,
    maxResponses,
  }: InterpreterInit) {
    this.model = model;
    this.hint = hint;
    this.actions = createActionRecord(resources || []);
    this.prompts = { ...defaultPrompts, ...prompts };
    if (maxResponses) this.maxResponses = maxResponses;
  }

  async run(
    interactions: Array<Interaction>,
    callback: (
      response: InterpreterResponse
    ) => Promise<InteractionOutput | undefined>
  ): Promise<void> {
    interactions = clone(interactions);
    if (!Object.keys(this.actions).length) {
      const response = await this.createTextResponse(interactions);
      callback(response);
      return;
    }

    for (let i = 0; i < this.maxResponses; i++) {
      const directive = await this._generateDirective(
        interactions,
        this.extendedActions()
      );

      let response: InterpreterResponse;
      let output: InteractionOutput;
      switch (directive.protocol) {
        case 'complete':
          await callback({ type: 'stop' });
          return;
        case 'text':
          response = await this.createTextResponse(interactions);
          output = clone(await callback(response));
          if (output)
            interactions[interactions.length - 1].outputs.push(output);
          break;
        default:
          response = this.createActionResponse(interactions);
          output = clone(await callback(response));
          if (output)
            interactions[interactions.length - 1].outputs.push(output);
      }
    }
  }

  /**
   * Generates a response to the user's query, which can be either text or an action call.
   * @param interactions An array of interactions
   * @returns An InterpreterResponse object, of type 'text' or 'action'.
   */
  async generateResponse(
    interactions: Array<Interaction>
  ): Promise<InterpreterResponse | null> {
    // If there are no actions, respond with text
    if (!Object.keys(this.actions).length) {
      return this.createTextResponse(interactions);
    }

    const directive = await this._generateDirective(
      interactions,
      this.extendedActions({ text: true })
    );

    if (!directive) {
      return null;
    } else if (directive.protocol === 'text') {
      return this.createTextResponse(interactions);
    } else {
      return this.createActionResponse(directive);
    }
  }

  /**
   * Generates an action directive in response to the user's query. Does not handle text generation or stop directives, unless specifically included.
   * @param interactions An array of interactions
   * @returns An ActionDirective promise based on the interpreter's resources.
   */
  async generateDirective(
    interactions: Array<Interaction>
  ): Promise<ActionDirective> {
    return this._generateDirective(interactions, this.actions);
  }

  /**
   * Same as above, but handles arbitrary actions, so we can add extended actions
   * on the fly.
   */
  private async _generateDirective(
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

  // An action we're adding on-the-fly to allow for text as an option
  extendedActions(
    opts?: ExtendedActionsOpts
  ): Record<string, ActionDefinition> {
    const textAction = { description: this.prompts.textActionDescription };
    const stopAction = { description: this.prompts.stopActionDescription };

    const extendedActions = {};
    if (!opts || opts.text) extendedActions['text'] = textAction;
    if (!opts || opts.stop) extendedActions['stop'] = stopAction;

    return { ...extendedActions, ...this.actions };
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

  createActionResponse(directive: ActionDirective): ActionResponse {
    return {
      type: 'action',
      directive,
    };
  }
}
