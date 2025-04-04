import { openai } from '@ai-sdk/openai';
import readline from 'readline';
import chalk from 'chalk';
import 'dotenv/config';

import { ActionOutput, Interaction, Interpreter } from '../../src';
import { Dispatcher } from '../../dist';
import { protocols } from './protocols';
import { createInteraction } from '../../src/utils';
import { fileInteraction } from './fs';
import resources from './resources';

const model = openai('gpt-4-turbo');
const interpreter = new Interpreter({ model, resources });
const dispatcher = new Dispatcher(protocols);
const interactions: Array<Interaction> = [];
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function handleInput(userInput: string) {
  if (userInput.toLowerCase() === 'exit') {
    console.log(chalk.bold('\nGoodbye!'));
    rl.close();
    return;
  }

  let interaction: Interaction = createInteraction(userInput);

  if (userInput.startsWith('/file ')) {
    interaction = fileInteraction(userInput);
  }

  interactions.push(interaction);

  try {
    console.log(chalk.bold(`\nKernel`));
    const response = await interpreter.generateResponse(interactions);

    if (response.type === 'text') {
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
    } else {
      const output: ActionOutput = {
        type: 'action',
        directive: response.directive,
        content: {},
      };

      output.content = await dispatcher.dispatch(response.directive);
      console.log(output);
      interaction.outputs = [output];
    }
  } catch (error) {
    console.error(chalk.red('Error:', error));
  }

  promptUser();
}

function promptUser() {
  rl.question(chalk.bold('\nYou\n'), handleInput);
}

console.log(chalk.italic('Chat with the kernel! Type "exit" to quit.'));
promptUser();
