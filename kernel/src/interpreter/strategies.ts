import { Interpreter, InterpreterResponse } from './interpreter';
import { Interaction } from './interactions';

export interface Strategy {
  description: string;
  method: (
    interpreter: Interpreter,
    interactions: Interaction[]
  ) => AsyncGenerator<InterpreterResponse, any, Array<Interaction>>;
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
    // Get all actions, then execute them
    const actionResponses =
      await interpreter.createActionResponses(interactions);
    for (const response of actionResponses) {
      interactions = yield response;
    }

    // Finally, respond with some text
    yield await interpreter.createTextResponse(interactions);
    return;
  },
};

export { defaultStrategies };
