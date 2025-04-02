import dedent from 'dedent';
import { ActionRecord, Strategy, StrategyRecord } from './types.js';

function strategyString(strategies: Record<string, Strategy>) {
  const result: Record<string, string> = {};
  for (const [key, strategy] of Object.entries(strategies)) {
    result[key] = strategy.description;
  }
  return JSON.stringify(result);
}

function chooseStrategy(actions: ActionRecord, strategies: StrategyRecord) {
  return dedent`
    In this environment you have access to a set of functions you can use to answer the user's question.
    Here are the functions available in JSONSchema format:
    ${JSON.stringify(actions)}
    With the above available functions in mind, choose from one of the following strategies to use while handling the user's query:
    ${strategyString(strategies)}
  `;
}

export const prompts = {
  chooseStrategy,
};
