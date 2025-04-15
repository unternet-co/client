import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import readline from 'readline';
import chalk from 'chalk';
import 'dotenv/config';

import {
  ActionOutput,
  Interaction,
  InteractionOutput,
  Interpreter,
  Dispatcher,
  TextResponse,
  ActionResponse,
} from '../../src';
import { Command } from './types';
import { protocols } from './protocols';
import * as commands from './commands';
import resources from './resources';

/* MODEL & KERNEL SETUP */

const model = openai('gpt-4o');
// const model = anthropic('claude-3-7-sonnet-20250219');
const interpreter = new Interpreter({ model, resources });
const dispatcher = new Dispatcher(protocols);

/* CLI INPUT & OUTPUT MANAGEMENT */

const interactions: Interaction[] = [];
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * CLI input handler.
 *
 * Supports interaction reuse, hence the function currying.
 */
const handleInput =
  (interaction?: Interaction) => async (userInput: string) => {
    // Execute a command if one was provided,
    // and ensure an interaction.
    switch (command(userInput)) {
      case 'exit':
        console.log(chalk.bold('\nGoodbye!'));
        rl.close();
        return;

      case 'file':
        interaction = commands.file.interaction(userInput, interaction);
        break;

      default:
        interaction = interaction || { input: {}, outputs: [] };
        interaction.input.text = userInput;
    }

    // If no text was assigned to the interaction input,
    // stop here and initiate another user prompt.
    if (!interaction.input.text) return promptUser(interaction);

    // Add interaction to stack
    interactions.push(interaction);
    console.log(chalk.bold(`\nKernel`));

    // Interpret the interaction
    try {
      const responses = interpreter.run(interactions);

      let iteration = await responses.next();
      while (!iteration.done) {
        const response = iteration.value;
        switch (response.type) {
          case 'text':
            await appendTextOutput(response, interaction!);
            break;
          case 'action':
            await appendActionOutput(response, interaction!);
            break;
          default:
            console.error('Error: Unrecognized action type.');
        }
        iteration = await responses.next(interactions);
      }
    } catch (error) {
      console.error(chalk.red('Error:', error));
      console.error(error);
    }

    // Initiate another user prompt
    promptUser();
  };

/**
 * Check if a command was used or not.
 */
function command(userInput: string): Command | null {
  const lowerInput = userInput.toLowerCase();

  if (lowerInput === 'exit' || lowerInput === '/exit') {
    return 'exit';
  }

  if (lowerInput.startsWith('/file ')) {
    return 'file';
  }

  return null;
}

/**
 * Manage an action response from the interpreter.
 */
async function appendActionOutput(
  response: ActionResponse,
  interaction: Interaction
) {
  const output: ActionOutput = {
    type: 'action',
    directive: response.directive,
    content: {},
  };

  output.content = await dispatcher.dispatch(response.directive);
  console.log(output.content);
  interaction.outputs = [output];
  return output;
}

/**
 * Manage a text response from the interpreter.
 */
async function appendTextOutput(
  response: TextResponse,
  interaction: Interaction
): Promise<InteractionOutput> {
  let totalText = '';
  for await (const part of response.textStream) {
    totalText += part;
    process.stdout.write(part);
  }
  process.stdout.write('\n');
  interaction.outputs = [
    {
      type: 'text',
      content: totalText,
    },
  ];
  return {
    type: 'text',
    content: totalText,
  };
}

/* PROMPTS */

function promptUser(interaction?: Interaction) {
  rl.question(chalk.bold('\nYou\n'), handleInput(interaction));
}

/* PRINT INTRO */

console.log(chalk.italic('Chat with the kernel! Type "exit" to quit.'));
console.log('\nAdditional commands:');
console.log(
  '/file',
  '<path(s)_to_file_or_folder> <optional_msg_for_assistant>'
);

/* 🚀 INITIAL PROMPT */

promptUser();
