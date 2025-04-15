import dedent from 'dedent';
import { ActionDefinition } from './types.js';

const responseModes = {
  TEXT: 'Respond directly to the user with text/markdown.',
  TOOL: 'Use one of the provided tools.',
  DONE: 'Respond with this to complete your turn, and await further input from the user.',
};

function chooseResponseMode(responseModes: Record<string, string>) {
  const possibleOutputs = Object.keys(responseModes)
    .map((x) => `"${x}"`)
    .join(' or ');
  return dedent`
    Choose from one of the following "response modes". This is not your actual response, but will determine the action you take next.
    Possible response modes:
    ${JSON.stringify(responseModes)}
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

interface SystemInit {
  actions?: Record<string, ActionDefinition>;
  hint?: string;
  num?: number;
}

function system({ actions, hint }: SystemInit) {
  let prompt = '';

  prompt += `You are a helpful assistant. In responding to the user, you can use a tool or respond directly, or some combination of both. DO NOT repeat yourself or conduct repeating tool calls that perform the same action. You may need to ask for additional information or clarification before calling tools. Once you have responded to the user, you should stop responding.\n\ns`;

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
  responseModes,
  chooseResponseMode,
  chooseAction,
  system,
};

export type InterpreterPrompts = typeof prompts;

export default prompts;
