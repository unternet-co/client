import dedent from 'dedent';
import { ActionDefinition, Strategy } from './types.js';

function chooseStrategy(strategies: Record<string, Strategy>) {
  const possibleOutputs = Object.keys(strategies)
    .map((x) => `"${x}"`)
    .join(' or ');
  return dedent`
    Choose from one of the following strategies to use in order to best respond to the user's query. (This is not your actual response, but will determine the type of response you give).
    Possible strategies:
    ${JSON.stringify(strategies)}
    Respond with only one of the following strings: ${possibleOutputs}
  `;
}

function chooseAction() {
  return dedent`
    Choose a tool from the given tool options that can help resolve the user's query, and fill out the appropriate parameters if any. Your response should take the form of a JSON object, e.g.:
    {"id":"<action_id>","args":{...}}
    Where the <action_id> should be replaced with the selected action's key, and "args" is an optional object that corresponds to the required params_schema if present.
  `;
}

function think(inputPrompt?: string) {
  let prompt = '';
  if (inputPrompt) {
    prompt += `<UPCOMING_MESSAGE>${inputPrompt}</UPCOMING_MESSAGE>\n`;
  }
  prompt +=
    'Before you respond to the above, take a moment and think about your next step, and respond in a brief freeform text thought.';
  return prompt;
}

interface SystemInit {
  actions?: Record<string, ActionDefinition>;
  hint?: string;
  num?: number;
}

function system({ actions, hint }: SystemInit) {
  let prompt = '';

  prompt += `You are a helpful assistant. In responding to the user, you can use a tool or respond directly, or some combination of both.\n\n`;

  if (actions) {
    prompt += dedent`
      TOOL USE INFORMATION:
      In this environment you have access to a set of tools you can use.
      Here is an object representing the tools available:
      ${JSON.stringify(actions)} \n\n`;
  }

  if (hint) {
    prompt += `USER INSTRUCTIONS & GUIDELINES: \n${hint} \n\n`;
  }

  return prompt.trim();
}

const prompts = {
  chooseStrategy,
  chooseAction,
  system,
  think,
};

export type InterpreterPrompts = typeof prompts;

export default prompts;
