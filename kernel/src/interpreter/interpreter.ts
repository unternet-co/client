import {
  LanguageModel,
  streamText,
  generateObject,
  generateText,
  Schema,
} from 'ai';
import defaultPrompts, { InterpreterPrompts } from './prompts';
import { actionChoiceSchema, schemas } from './schemas';
import { defaultStrategies, Strategy } from './strategies';
import {
  ActionDirective,
  createActionRecord,
  decodeActionHandle,
} from '../runtime/actions';
import { ActionDefinition, Resource } from '../runtime/resources';
import { KernelMessage, modelMsg, toModelMessages } from './messages';

export interface BaseResponse {
  correlationId: string;
}

export interface TextResponse extends BaseResponse {
  type: 'text';
  text: Promise<string>;
  textStream: AsyncIterable<string>;
}

export interface ActionResponse extends BaseResponse {
  type: 'action';
  directive: ActionDirective;
}

export type InterpreterResponse = TextResponse | ActionResponse;

interface InterpreterInit {
  model: LanguageModel;
  resources?: Array<Resource>;
  strategies?: Record<string, Strategy>;
  prompts?: InterpreterPrompts;
  hint?: string;
}

interface GenerateOpts<T = unknown> {
  messages: KernelMessage[];
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
  async *run(messages: Array<KernelMessage>) {
    const correlationId = messages.at(-1).correlationId;

    // TODO: Ensure latest message is an input
    // TODO: Return correlation ID in response object
    if (!Object.keys(this.actions).length) {
      yield this.generateTextResponse(messages);
      return;
    }

    const strategy = await this.chooseStrategy(messages);
    if (strategy in this.strategies) {
      const responses = this.strategies[strategy].method(this, messages);
      let iteration = await responses.next();
      while (!iteration.done) {
        const response = iteration.value as InterpreterResponse;
        response.correlationId = correlationId;
        const updatedMessages = yield response;
        iteration = await responses.next(updatedMessages);
      }
      return;
    }

    throw new Error("Couldn't generate a valid response.");
  }

  /**
   * Chooses a strategy to respond to the user's query
   * @param messages An array of kernel messages
   * @returns An InterpreterResponse object, of type 'text' or 'action'.
   */
  async chooseStrategy(messages: KernelMessage[]) {
    const { strategy } = await this.generateObject({
      messages,
      prompt: this.prompts.chooseStrategy(this.strategies),
      schema: schemas.strategies(this.strategies),
      think: true,
    });

    return strategy;
  }

  /* === TEXT & OBJECT GENERATORS === */

  async generateText({ messages, system, prompt, think }: GenerateOpts) {
    const modelMsgs = toModelMessages(messages);

    if (think) {
      const thought = await this.generateText({
        messages,
        system,
        prompt: this.prompts.think(prompt),
      });
      modelMsgs.push(modelMsg('assistant', thought));
    }
    if (prompt) modelMsgs.push(modelMsg('user', prompt));
    if (prompt) modelMsgs.push(modelMsg('user', prompt));

    const output = await generateText({
      model: this.model,
      messages: modelMsgs,
      system:
        system ||
        this.prompts.system({ actions: this.actions, hint: this.hint }),
    });

    return output.text;
  }

  async streamText({ messages, system, prompt, think }: GenerateOpts) {
    // TODO: Put all this into createMessages
    const modelMsgs = toModelMessages(messages);
    if (think) {
      const thought = await this.generateText({
        messages,
        system,
        prompt: this.prompts.think(prompt),
      });
      modelMsgs.push(modelMsg('assistant', thought));
    }
    if (prompt) modelMsgs.push(modelMsg('user', prompt));
    if (prompt) modelMsgs.push(modelMsg('user', prompt));

    const output = streamText({
      model: this.model,
      messages: modelMsgs,
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
    messages,
    schema,
    system,
    prompt,
    think,
  }: GenerateOpts<T>) {
    const modelMsgs = toModelMessages(messages);
    if (think) {
      const thought = await this.generateText({
        messages,
        system,
        prompt: this.prompts.think(prompt),
      });
      modelMsgs.push(modelMsg('assistant', thought));
    }
    if (prompt) modelMsgs.push(modelMsg('user', prompt));

    const output = await generateObject({
      model: this.model,
      messages: modelMsgs,
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
  async generateTextResponse(
    messages: Array<KernelMessage>
  ): Promise<TextResponse> {
    const correlationId = messages.at(-1).correlationId;
    const output = await this.streamText({ messages });

    return {
      type: 'text',
      text: output.text,
      textStream: output.textStream,
      correlationId,
    };
  }

  async generateActionResponse(
    messages: Array<KernelMessage>
  ): Promise<ActionResponse> {
    const responses = await this.generateActionResponses(messages);
    return responses[0];
  }

  /**
   * Generates an action directive in response to the user's query.
   * @param interactions An array of interactions
   * @returns An ActionResponse containing the action directive.
   */
  async generateActionResponses(
    messages: Array<KernelMessage>
  ): Promise<ActionResponse[]> {
    const correlationId = messages.at(-1).correlationId;

    const { tools } = await this.generateObject({
      messages,
      system: this.prompts.system({ actions: this.actions, hint: this.hint }),
      prompt: this.prompts.chooseAction(),
      schema: actionChoiceSchema(this.actions),
    });

    return tools.map((tool) => {
      const { uri, actionId } = decodeActionHandle(tool.id);
      return {
        type: 'action',
        directive: {
          uri,
          actionId,
          args: tool.args,
        },
        correlationId,
      };
    });
  }
}
