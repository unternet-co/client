import { LanguageModel, streamText, generateObject, generateText } from 'ai';
import {
  ActionDefinition,
  ActionResponse,
  Interaction,
  Resource,
  Strategy,
  TextResponse,
} from './types';
import {
  createActionRecord,
  createMessages,
  createUserMessage,
  createAssistantMessage,
  decodeActionUri,
} from './utils';
import defaultPrompts, { InterpreterPrompts } from './prompts';
import { ActionChoiceObject, actionChoiceSchema, schemas } from './schemas';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface InterpreterInit {
  model: LanguageModel;
  resources?: Array<Resource>;
  strategies?: Record<string, Strategy>;
  prompts?: InterpreterPrompts;
  hint?: string;
}

const defaultStrategies: Record<string, Strategy> = {};

defaultStrategies.TEXT = {
  description: `Respond directly to the user with text/markdown.`,
  method: async function* (
    interpreter: Interpreter,
    interactions: Array<Interaction>
  ) {
    yield await interpreter.createTextResponse(interactions);
    return;
  },
};

defaultStrategies.RESEARCH = {
  description: `Use one or more tools, then respond to the user based on the tool output. If you already have the required information from a prior tool call DO NOT use this, instead use TEXT (assume all prior information is still up-to-date). If you don't have the required information to use the tool, use TEXT to ask a follow-up question to clarify.`,
  method: async function* (
    interpreter: Interpreter,
    interactions: Array<Interaction>
  ) {
    interactions = yield await interpreter.createActionResponse(interactions);
    const response = await interpreter.createTextResponse(interactions);
    yield response;
    return;
  },
};

interface GenerateOpts {
  think: boolean;
}

export class Interpreter {
  model: LanguageModel;
  actions: Record<string, ActionDefinition>;
  prompts: InterpreterPrompts;
  strategies: Record<string, Strategy>;
  hint: string;

  constructor({
    model,
    resources,
    prompts,
    hint,
    strategies,
  }: InterpreterInit) {
    this.model = model;
    this.hint = hint;
    this.actions = createActionRecord(resources || []);
    this.prompts = { ...defaultPrompts, ...prompts };
    this.strategies = { ...defaultStrategies, ...strategies };
  }

  /**
   * Runs the interpretation loop with a given set of interactions, returning when complete.
   * @param interactions An array of interactions
   * @returns An async generator function that yields responses, and whose next() function takes an array of interactions
   */
  async *run(interactions: Array<Interaction>) {
    if (!Object.keys(this.actions).length) {
      yield this.createTextResponse(interactions);
      return;
    }

    const strategy = await this.chooseStrategy(interactions);
    if (strategy in this.strategies) {
      const responses = this.strategies[strategy].method(this, interactions);

      let response = await responses.next();
      while (!response.done) {
        const newInteractions = yield response.value;
        response = await responses.next(newInteractions);
      }
      return;
    }

    throw new Error("Couldn't generate a valid response.");
  }

  /**
   * Chooses a strategy to respond to the user's query
   * @param interactions An array of interactions
   * @returns An InterpreterResponse object, of type 'text' or 'action'.
   */
  async chooseStrategy(interactions: Array<Interaction>) {
    const thought = await this.generateThought(
      interactions,
      this.prompts.chooseStrategy(this.strategies)
    );

    const messages = createMessages(interactions);
    messages.push(createAssistantMessage(thought));
    messages.push(
      createUserMessage(this.prompts.chooseStrategy(this.strategies))
    );

    const output = await generateObject({
      model: this.model,
      messages,
      system: this.prompts.system({ actions: this.actions, hint: this.hint }),
      schema: schemas.strategies(this.strategies),
    });

    const { strategy } = output.object;
    return strategy;
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

  async generateThought(interactions: Array<Interaction>, prompt?: string) {
    const messages = createMessages(interactions);
    if (prompt) messages.push(createUserMessage(prompt));
    messages.push(createUserMessage(this.prompts.think()));
    const { text } = await generateText({
      model: this.model,
      system: this.prompts.system({ actions: this.actions, hint: this.hint }),
      messages,
    });

    console.log('Thought', text);
    return text;
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
      directive: {
        protocol,
        resourceId,
        actionId,
        args: fn.args,
      },
    };
  }
}
