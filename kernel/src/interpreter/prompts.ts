import dedent from 'dedent';
import { ActionDefinition } from '../runtime/actions';
import { flags } from './flags';
import { Strategy } from './strategies';

function chooseStrategy(strategies: Record<string, Strategy>) {
  const possibleOutputs = Object.keys(strategies)
    .map((x) => `"${x}"`)
    .join('|');
  const descriptions = JSON.stringify(strategies);
  return dedent`
    Choose from one of the following available strategies to use in order to best respond to the user's query. (This is not your actual response, but will determine the type of response you give).
    Available strategies are listed below in a discriminated union format with the name Strategy.
    \`\`\`
    type Strategy = ${possibleOutputs};
    \`\`\`
    Be sure to look at the name and description of each strategy.
    Here is a JSON object that maps each strategy to its associated description:
    \`\`\`
    ${descriptions}
    \`\`\`
    Your response should take the form of a JSON object that adheres to this interface:
    \`\`\`
    interface Response {
      strategy: Strategy;
    };
    \`\`\`
    Where the response is an object with key "strategy" and the value is one of the allowed strings in the discriminated union given previously.
    Respond with the strategy you think is best for the user query in the JSON format mentioned above.
  `;
}

function chooseAction() {
  return dedent`
    Choose one or more tools from the given tool options that can help resolve the user's query, and fill out the appropriate parameters if any. Your response should take the form of a JSON object that adheres to this interface:
    { tools: Array<{ id: string; display: string; args?: any; }> }
    Where the "id" should be contain the selected action's key, and "args" is an optional object that corresponds to the required params_schema if present.
    \`display\` can be one of the following values:
    ${flags.display}
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

  prompt += `You are a helpful assistant. In responding to the user, you can use a tool or respond directly, or some combination of both. If your responses refer to information with links, be sure to cite them using links in the natural flow of text.\n\n`;

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
