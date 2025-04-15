import { Interpreter } from './interpreter';
import { Interaction, Strategy } from './types';

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

export { defaultStrategies };
