import { Interpreter, InterpreterInput } from '.';
import { InterpreterResponse } from '../shared/responses';
import { KernelMessage } from './messages';

export interface Strategy {
  description: string;
  call: (
    interpreter: Interpreter,
    input: InterpreterInput
  ) => AsyncGenerator<InterpreterResponse, any, Array<KernelMessage>>;
}

const defaultStrategies: Record<string, Strategy> = {};

defaultStrategies.TEXT = {
  description: `Respond directly to the user with text/markdown.`,
  call: async function* (interpreter: Interpreter, input: InterpreterInput) {
    yield await interpreter.createTextResponse(input);
  },
};

defaultStrategies.DISPLAY = {
  description: `Use one tool, then show the output of that tool directly to the user. Use this in situations where the user most likely wants to directly view the UI of the tool in question, instead of a summary.`,
  call: async function* (interpreter: Interpreter, input: InterpreterInput) {
    yield await interpreter.createActionResponse({
      ...input,
      display: 'standalone',
    });
  },
};

export { defaultStrategies };

// defaultStrategies.RESEARCH = {
//   description: dedent`
//     Use one or more tools, then respond to the user based on the tool output.
//     If you already have the required information from a prior tool call DO NOT use this, instead use TEXT (assume all prior information is still up-to-date). If you don't have the required information to use the tool, use TEXT to ask a follow-up question to clarify.
//     Here are some tips:
//     - You may use as many tools as you wish, it's recommended you err on the side of MORE not less, to retrieve as much relevant information as possible.
//     - We also recommend using tool multiple times with different queries to cover more ground.
//     `,
//   method: async function* (
//     interpreter: Interpreter,
//     messages: Array<KernelMessage>
//   ) {
//     // Get all actions, then execute them
//     const actionResponses = await interpreter.generateActionResponses(
//       messages,
//       { display: 'hidden' }
//     );
//     for (const response of actionResponses) {
//       messages = yield response;
//     }

//     // Finally, respond with some text
//     yield await interpreter.generateTextResponse(messages);
//   },
// };
