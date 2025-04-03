import dedent from 'dedent';
import { ActionDefinition, ActionRecord } from './types.js';

const textActionDescription = `Respond to the user with text/markdown. For giving a direct response to the user, summarizing/adding context, or asking a question if additional information is needed to use a function.`;

function chooseAction(actions: ActionRecord) {
  return dedent`
    In this environment you have access to a set of functions you can use to answer the user's question.
    Here are the functions available in JSONSchema format:
    ${JSON.stringify(actions)}
    Choose a function and fill out the appropriate parameters.
  `;
}

interface SystemInit {
  actions: Record<string, ActionDefinition>;
}

function system({ actions }: SystemInit) {
  let prompt = '';

  if (actions) {
    prompt += dedent`
      In this environment you have access to a set of functions you can use to answer the user's question.
      Here are the functions available in JSONSchema format:
      ${JSON.stringify(actions)}`;
  }

  return prompt;
}

const prompts = {
  textActionDescription,
  chooseAction,
  system,
};

export type InterpreterPrompts = typeof prompts;

export default prompts;
