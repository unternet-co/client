import dedent from 'dedent';
import { Interpreter } from '.';
import { KernelResponse } from '../response-types';
import { KernelMessage } from './messages';

export interface Strategy {
  description: string;
  method: (
    interpreter: Interpreter,
    messages: KernelMessage[]
  ) => AsyncGenerator<KernelResponse, any, Array<KernelMessage>>;
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
  description: dedent`
    Use one or more tools, then respond to the user based on the tool output.
    If you already have the required information from a prior tool call DO NOT use this, instead use TEXT (assume all prior information is still up-to-date). If you don't have the required information to use the tool, use TEXT to ask a follow-up question to clarify.
    Here are some tips:
    - You may use as many tools as you wish, it's recommended you err on the side of MORE not less, to retrieve as much relevant information as possible.
    - We also recommend using tool multiple times with different queries to cover more ground.
    `,
  method: async function* (
    interpreter: Interpreter,
    messages: Array<KernelMessage>
  ) {
    // Get all actions, then execute them
    const actionResponses = await interpreter.generateActionResponses(
      messages,
      { display: 'snippet' }
    );
    for (const response of actionResponses) {
      messages = yield response;
    }

    // Finally, respond with some text
    yield await interpreter.generateTextResponse(messages);
  },
};

defaultStrategies.DISPLAY = {
  description: `Use one tool, then show the output of that tool directly to the user. Use this in situations where the user most likely wants to directly view the UI of the tool in question, instead of a summary.`,
  method: async function* (
    interpreter: Interpreter,
    messages: Array<KernelMessage>
  ) {
    // Get all actions, then execute them
    yield await interpreter.generateActionResponse(messages, {
      display: 'inline',
    });
  },
};

export { defaultStrategies };
