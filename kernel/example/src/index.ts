import { openai } from '@ai-sdk/openai';
import readline from 'readline';
import chalk from 'chalk';
import 'dotenv/config';

import { ActionOutput, Interaction, Interpreter } from '../../src';
import { Dispatcher } from '../../dist';
import { protocols } from './protocols';
import { createInteraction } from '../../src/utils';
import { fileInteractions, folderInteractions } from './fs';
import resources from './resources';

const model = openai('gpt-4-turbo');
const interpreter = new Interpreter({ model, resources });
const dispatcher = new Dispatcher(protocols);
const interactions: Array<Interaction> = [];
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/* Input handler */

const handleInput =
  (interaction?: Interaction) => async (userInput: string) => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput === 'exit' || lowerInput === '/exit') {
      console.log(chalk.bold('\nGoodbye!'));
      rl.close();
      return;
    }

    if (lowerInput.startsWith('/file ') || lowerInput.startsWith('/files ')) {
      interaction = fileInteractions(userInput, interaction);
      if (!interaction.input.text) return promptUser(interaction);
    } else if (lowerInput.startsWith('/folder ')) {
      interaction = folderInteractions(
        userInput,
        { ignoreDotFiles: true, recursive: false },
        interaction
      );
      console.log('📂', interaction.input);
      if (!interaction.input.text) return promptUser(interaction);
    } else {
      interaction = interaction || createInteraction(userInput);
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
      console.error(error);
    }

    promptUser();
  };

function promptUser(interaction?: Interaction) {
  rl.question(chalk.bold('\nYou\n'), handleInput(interaction));
}

console.log(chalk.italic('Chat with the kernel! Type "exit" to quit.'));
console.log('\nAdditional commands:');
console.log(
  '/file' + chalk.grey('s'),
  '<path_to_file> <optional_msg_for_assistant>'
);
console.log(
  '/folder' + chalk.grey('s'),
  '<path_to_folder> <optional_msg_for_assistant>'
);

promptUser();
