import { Interpreter, InterpreterResponse } from '.';
import { KernelMessage } from './messages';

export interface Strategy {
  description: string;
  method: (
    interpreter: Interpreter,
    messages: KernelMessage[]
  ) => AsyncGenerator<InterpreterResponse, any, Array<KernelMessage>>;
}

const defaultStrategies: Record<string, Strategy> = {};

defaultStrategies.TEXT = {
  description: `Respond directly to the user with text/markdown.`,
  method: async function* (
    interpreter: Interpreter,
    messages: Array<KernelMessage>
  ) {
    yield await interpreter.generateTextResponse(messages);
    return;
  },
};

defaultStrategies.RESEARCH = {
  description: `Use one or more tools, then respond to the user based on the tool output. If you already have the required information from a prior tool call DO NOT use this, instead use TEXT (assume all prior information is still up-to-date). If you don't have the required information to use the tool, use TEXT to ask a follow-up question to clarify.`,
  method: async function* (
    interpreter: Interpreter,
    messages: Array<KernelMessage>
  ) {
    // Get all actions, then execute them
    const actionResponses = await interpreter.generateActionResponses(messages);
    for (const response of actionResponses) {
      messages = yield response;
    }

    // Finally, respond with some text
    yield await interpreter.generateTextResponse(messages);
    return;
  },
};

export { defaultStrategies };
