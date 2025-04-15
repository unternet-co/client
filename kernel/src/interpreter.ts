import { LanguageModel, streamText, generateObject, generateText } from 'ai';
import {
  ActionDefinition,
  ActionResponse,
  Interaction,
  Schema,
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
import { defaultStrategies } from './strategies';

type InterpreterLogger = (
  type: 'thought' | 'action' | 'input' | 'text',
  content: string
) => void;

interface InterpreterInit {
  model: LanguageModel;
  resources?: Array<Resource>;
  strategies?: Record<string, Strategy>;
  prompts?: InterpreterPrompts;
  hint?: string;
  logger: InterpreterLogger;
}

interface GenerateOpts<T = unknown> {
  interactions: Interaction[];
  prompt?: string;
  schema?: Schema<T>;
  system?: string;
  think?: true;
}

export class Interpreter {
  model: LanguageModel;
  actions: Record<string, ActionDefinition>;
  prompts: InterpreterPrompts;
  strategies: Record<string, Strategy>;
  hint: string;
  logger: InterpreterLogger = () => {};

  constructor({
    model,
    resources,
    prompts,
    hint,
    strategies,
    logger,
  }: InterpreterInit) {
    this.model = model;
    this.hint = hint;
    this.actions = createActionRecord(resources || []);
    this.prompts = { ...defaultPrompts, ...prompts };
    this.strategies = { ...defaultStrategies, ...strategies };
    if (logger) this.logger = logger;
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
    const { strategy } = await this.generateObject({
      interactions,
      prompt: this.prompts.chooseStrategy(this.strategies),
      schema: schemas.strategies(this.strategies),
      think: true,
    });

    return strategy;
  }

  /* === TEXT & OBJECT GENERATORS === */

  async generateText({ interactions, system, prompt, think }: GenerateOpts) {
    const messages = createMessages(interactions);
    if (think) {
      const thought = await this.generateText({
        interactions,
        system,
        prompt: this.prompts.think(prompt),
      });
      this.logger('thought', thought);
      messages.push(createAssistantMessage(thought));
    }
    if (prompt) messages.push(createUserMessage(prompt));
    if (prompt) messages.push(createUserMessage(prompt));

    const output = await generateText({
      model: this.model,
      messages,
      system:
        system ||
        this.prompts.system({ actions: this.actions, hint: this.hint }),
    });

    return output.text;
  }

  async streamText({ interactions, system, prompt, think }: GenerateOpts) {
    // TODO: Put all this into createMessages
    const messages = createMessages(interactions);
    if (think) {
      const thought = await this.generateText({
        interactions,
        system,
        prompt: this.prompts.think(prompt),
      });
      this.logger('thought', thought);
      messages.push(createAssistantMessage(thought));
    }
    if (prompt) messages.push(createUserMessage(prompt));
    if (prompt) messages.push(createUserMessage(prompt));

    const output = streamText({
      model: this.model,
      messages,
      system:
        system ||
        this.prompts.system({ actions: this.actions, hint: this.hint }),
    });

    return {
      text: output.text,
      textStream: output.textStream,
    };
  }

  async generateObject<T>({
    interactions,
    schema,
    system,
    prompt,
    think,
  }: GenerateOpts<T>) {
    const messages = createMessages(interactions);
    if (think) {
      const thought = await this.generateText({
        interactions,
        system,
        prompt: this.prompts.think(prompt),
      });
      this.logger('thought', thought);
      messages.push(createAssistantMessage(thought));
    }
    if (prompt) messages.push(createUserMessage(prompt));

    const output = await generateObject({
      model: this.model,
      messages,
      system:
        system ||
        this.prompts.system({ actions: this.actions, hint: this.hint }),
      schema,
    });

    return output.object;
  }

  /* === RESPONSES === */

  /**
   * Generates a simple streaming text response.
   * @param interactions An array of interactions.
   * @returns A TextResponse object, which can be used to get or stream the response text.
   */
  async createTextResponse(
    interactions: Array<Interaction>
  ): Promise<TextResponse> {
    const output = await this.streamText({ interactions });

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
      directive: {
        protocol,
        resourceId,
        actionId,
        args: fn.args,
      },
    };
  }
}
