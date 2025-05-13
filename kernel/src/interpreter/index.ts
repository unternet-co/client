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
  createActionDict,
  decodeActionHandle,
  encodeActionHandle,
  ProcessDisplayMode,
} from '../runtime/actions';
import { Resource } from '../runtime/resources';
import { ActionDefinition } from '../runtime/actions';
import { KernelMessage, modelMsg, toModelMessages } from './messages';
import {
  actionProposalResponse,
  ActionProposalResponse,
  DirectResponse,
  KernelResponse,
} from '../response-types';

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

interface ActionGenerationOpts {
  display: ProcessDisplayMode;
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
  async *run(messages: Array<KernelMessage>) {
    if (!Object.keys(this.actions).length) {
      yield this.generateTextResponse(messages);
      return;
    }

    const strategy = await this.chooseStrategy(messages);
    if (strategy in this.strategies) {
      const responses = this.strategies[strategy].method(this, messages);
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
  async chooseStrategy(messages: KernelMessage[]) {
    const { strategy } = await this.generateObject({
      messages,
      prompt: this.prompts.chooseStrategy(this.strategies),
      schema: schemas.strategies(this.strategies),
      think: true,
    });

    return strategy;
  }

  /* === RESPONDERS === */

  /**
   * Generates a simple streaming text response.
   * @param messages An array of messages.
   * @returns A TextResponse object, which can be used to get or stream the response text.
   */
  async generateTextResponse(
    messages: Array<KernelMessage>
  ): Promise<DirectResponse> {
    const output = await this.streamText({ messages });

    return {
      type: 'direct',
      mimeType: 'text/markdown',
      content: output.text,
      contentStream: output.textStream,
    };
  }

  async generateActionResponse(
    messages: Array<KernelMessage>,
    opts?: ActionGenerationOpts
  ): Promise<ActionProposalResponse> {
    const responses = await this.generateActionResponses(messages, opts);
    return responses[0];
  }

  /**
   * Generates an action proposal in response to the user's query.
   * @param messages An array of messages
   * @returns An ActionResponse containing the action proposal.
   */
  async generateActionResponses(
    messages: Array<KernelMessage>,
    opts?: ActionGenerationOpts
  ): Promise<ActionProposalResponse[]> {
    const { tools } = await this.generateObject({
      messages,
      system: this.prompts.system({ actions: this.actions, hint: this.hint }),
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
        display = opts?.display ?? tool.display;
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
      console.log('[INTERPRETER] Thought: ', thought);
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

  /* === UTILITY METHODS === */

  updateResources(resources: Array<Resource> = []) {
    this.actions = createActionDict(resources);
  }

  private findAction(uri: string, actionId: string) {
    return this.actions[encodeActionHandle(uri, actionId)];
  }
}
