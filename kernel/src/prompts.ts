import dedent from 'dedent';
import { ActionDefinition, ActionRecord } from './types.js';

export const responseModes = {
  TEXT: 'Respond directly to the user with markdown.',
  TOOL: 'Use one of the provided tools.',
  STOP: 'Complete your response.',
};

function chooseAction(actions: ActionRecord) {
  return dedent`
    In this environment you have access to a set of tools you can use to answer the user's question.
    Here is an object representing the tools available:
    ${JSON.stringify(actions, null, 2)}
    Choose a tool and fill out the appropriate parameters (if any).
  `;
}

interface SystemInit {
  actions?: Record<string, ActionDefinition>;
  hint?: string;
}

function system({ actions, hint }: SystemInit) {
  let prompt = '';

  if (actions) {
    prompt += dedent`
      In this environment you have access to a set of tools you can use to answer the user's question.
      Here is an object representing the tools available:
      ${JSON.stringify(actions)}\n\n`;
  }

  if (hint) {
    prompt += `User instructions & guidelines:\n${hint}\n\n`;
  }

  return prompt;
}

const prompts = {
  responseModes,
  chooseAction,
  system,
};

export type InterpreterPrompts = typeof prompts;

export default prompts;
