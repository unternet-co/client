import {
  LanguageModel,
  streamText,
  generateObject,
  generateText,
  Schema,
} from 'ai';
import {
  createActionDict,
  decodeActionHandle,
  encodeActionHandle,
  ProcessDisplayMode,
} from '../runtime/actions';
import {
  actionProposalResponse,
  ActionProposalResponse,
  DirectResponse,
  InterpreterResponse,
  KernelResponse,
  thoughtResponse,
  logResponse,
} from '../shared/responses';
import defaultPrompts, { InterpreterPrompts } from './prompts';
import { actionChoiceSchema, schemas } from './schemas';
import { defaultStrategies, Strategy } from './strategies';
import { Resource } from '../runtime/resources';
import { ActionDefinition } from '../runtime/actions';
import { KernelMessage, modelMsg, toModelMessages } from './messages';
import { ProcessContainer } from '../runtime/processes';

interface InterpreterInit {
  model: LanguageModel;
  resources?: Array<Resource>;
  strategies?: Record<string, Strategy>;
  prompts?: InterpreterPrompts;
  hint?: string;
}

export interface InterpreterInput {
  messages: KernelMessage[];
  processes: ProcessContainer[];
  display?: ProcessDisplayMode;
}

interface GenerationOpts<T = unknown> {
  messages: KernelMessage[];
  prompt?: string;
  display?: ProcessDisplayMode;
  schema?: Schema<T>;
  system?: string;
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
    this.actions = createActionDict(resources || []);
    this.prompts = { ...defaultPrompts, ...prompts };
    this.strategies = { ...defaultStrategies, ...strategies };
  }

  /**
   * Runs the interpretation loop with a given set of messages, returning when complete.
   * @param messages An array of messages
   * @returns An async generator function that yields responses, and whose next() function takes an array of messages
   */
  async *run(
    input: InterpreterInput
  ): AsyncGenerator<KernelResponse, void, KernelMessage[]> {
    if (!Object.keys(this.actions).length) {
      yield await this.createTextResponse(input);
      return;
    }

    const strategy = yield* this.chooseStrategy(input);

    if (strategy in this.strategies) {
      const responses = this.strategies[strategy].call(this, input);
      let iteration = await responses.next();
      while (!iteration.done) {
        const response = iteration.value as KernelResponse;
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
   * @returns A KernelResponse object, of type 'direct' or 'actionproposal'
   */
  async *chooseStrategy(
    input: InterpreterInput
  ): AsyncGenerator<KernelResponse, string, KernelMessage[]> {
    yield await this.createThoughtResponse(
      input,
      this.prompts.chooseStrategy(this.strategies)
    );

    const { strategy } = await this.generateObject({
      messages: input.messages,
      system: this.prompts.system({
        actions: this.actions,
        hint: this.hint,
        processes: input.processes,
      }),
      prompt: this.prompts.chooseStrategy(this.strategies),
      schema: schemas.strategies(this.strategies),
    });

    yield logResponse(`Selected strategy: ${strategy}`);

    return strategy;
  }

  /**
   * Generates a thought response
   * @param input The interpreter input
   * @param prompt Optional prompt to generate the thought about
   */
  async createThoughtResponse(
    input: InterpreterInput,
    prompt?: string
  ): Promise<KernelResponse> {
    const thought = await this.generateText({
      messages: input.messages,
      prompt: this.prompts.think(prompt || ''),
    });

    return thoughtResponse(thought);
  }

  /* === RESPONDERS (return an InterpreterResponse) === */

  /**
   * Generates a simple streaming text response.
   * @param messages An array of messages.
   * @returns A TextResponse object, which can be used to get or stream the response text.
   */
  async createTextResponse(input: InterpreterInput): Promise<DirectResponse> {
    const output = await this.streamText({
      messages: input.messages,
      system: this.prompts.system({
        actions: this.actions,
        hint: this.hint,
        processes: input.processes,
      }),
    });

    return {
      type: 'direct',
      mimeType: 'text/markdown',
      content: output.text,
      contentStream: output.textStream,
    };
  }

  async createActionResponse(
    input: InterpreterInput
  ): Promise<ActionProposalResponse> {
    const responses = await this.createActionResponses(input);
    return responses[0];
  }

  /**
   * Generates an action proposal in response to the user's query.
   * @param messages An array of messages
   * @returns An ActionResponse containing the action proposal.
   */
  async createActionResponses(
    input: InterpreterInput
  ): Promise<ActionProposalResponse[]> {
    const { tools } = await this.generateObject({
      messages: input.messages,
      system: this.prompts.system({
        actions: this.actions,
        hint: this.hint,
        processes: input.processes,
      }),
      prompt: this.prompts.chooseAction(),
      schema: actionChoiceSchema(this.actions),
    });

    return tools.map((tool) => {
      const { uri, actionId } = decodeActionHandle(tool.id);

      let action: ActionDefinition;
      try {
        action = this.actions[tool.id];
      } catch {
        throw new Error('Action returned is not a valid action ID.');
      }

      let display: ProcessDisplayMode;
      if (action.display && action.display !== 'auto') {
        display = action.display;
      } else {
        display = tool.display;
      }

      const response = actionProposalResponse({
        uri,
        actionId,
        args: tool.args,
        display: display,
      });

      console.log('[INTERPRETER] Action proposal: ', response);
      return response;
    });
  }

  /* === TEXT & OBJECT GENERATORS (return objects, text, or text streams) === */

  async generateText(opts: GenerationOpts) {
    const { messages, system, prompt } = opts;
    const modelMsgs = toModelMessages(messages);

    if (prompt) modelMsgs.push(modelMsg('user', prompt));

    const output = await generateText({
      model: this.model,
      messages: modelMsgs,
      system,
    });

    return output.text;
  }

  async streamText(opts: GenerationOpts) {
    const modelMsgs = toModelMessages(opts.messages);
    console.log(opts.system);

    const output = streamText({
      model: this.model,
      system: opts.system,
      messages: modelMsgs,
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
  }: GenerationOpts<T>) {
    const modelMsgs = toModelMessages(messages);
    if (prompt) modelMsgs.push(modelMsg('user', prompt));

    const output = await generateObject({
      model: this.model,
      messages: modelMsgs,
      system,
      schema,
    });

    return output.object;
  }

  /* === UTILITY METHODS === */

  updateResources(resources: Array<Resource> = []) {
    this.actions = createActionDict(resources);
  }

  private findAction(uri: string, actionId: string) {
    return this.actions[encodeActionHandle(uri, actionId)];
  }
}
