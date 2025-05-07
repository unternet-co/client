import { openai } from '@ai-sdk/openai';
import readline from 'readline';
import chalk from 'chalk';
import 'dotenv/config';

import {
  ActionProposalResponse,
  DirectResponse,
  Interpreter,
  ProcessRuntime,
} from '../../src';
import { Command } from './types';
import { protocols } from './protocols';
import resources from './resources';
import {
  actionMessage,
  InputMessage,
  inputMessage,
  KernelMessage,
  responseMessage,
  ResponseMessage,
} from '../../src/interpreter/messages';

/* MODEL & KERNEL SETUP */

const model = openai('gpt-4o');
// const model = anthropic('claude-3-7-sonnet-20250219');
const interpreter = new Interpreter({
  model,
  resources,
  // logger: (type, content) =>
  //   console.log(chalk.bgGray(type.toUpperCase()), chalk.dim(content)),
});
const runtime = new ProcessRuntime(protocols);

/* CLI INPUT & OUTPUT MANAGEMENT */

const messages: KernelMessage[] = [];
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * CLI input handler.
 *
 * Supports interaction reuse, hence the function currying.
 */
async function handleInput(userInput: string) {
  let message: InputMessage;

  // Execute a command if one was provided,
  // and ensure an interaction.
  switch (command(userInput)) {
    case 'exit':
      console.log(chalk.bold('\nGoodbye!'));
      rl.close();
      return;

    case 'file':
      message = commands.file.message(userInput);
      break;

    default:
      message = inputMessage({
        text: userInput,
      });
  }

  messages.push(message);

  // If no text was assigned to the last input message,
  // stop here and initiate another user prompt.
  if (!message.text) return promptUser();

  console.log(chalk.bold(`\nKernel`));

  // Interpret the interaction
  try {
    const responses = interpreter.run(messages);

    let iteration = await responses.next();
    while (!iteration.done) {
      const response = iteration.value;
      switch (response.type) {
        case 'direct':
          const responseMsg = await createResponseMessage(response);
          messages.push(responseMsg);
          break;
        case 'actionproposal':
          const actionMsg = await createActionMessage(response);
          messages.push(actionMsg);
          break;
        default:
          console.error('Error: Unrecognized action type.');
      }
      iteration = await responses.next(messages);
    }
  } catch (error) {
    console.error(chalk.red('Error:', error));
    console.error(error);
  }

  // Initiate another user prompt
  promptUser();
}

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
async function createActionMessage(response: ActionProposalResponse) {
  const content = await runtime.dispatch(response);

  const outputMessage = actionMessage({
    uri: response.uri,
    actionId: response.actionId,
    args: response.args,
    content,
  });

  console.log(
    chalk.bgGray('ACTION'),
    '\n',
    chalk.dim(JSON.stringify(outputMessage.content, null, 2))
  );

  return outputMessage;
}

/**
 * Manage a text response from the interpreter.
 */
async function createResponseMessage(
  response: DirectResponse
): Promise<ResponseMessage> {
  let totalText = '';
  for await (const part of response.contentStream) {
    totalText += part;
    process.stdout.write(part);
  }
  process.stdout.write('\n');

  return responseMessage({
    text: totalText,
  });
}

/* PROMPTS */

function promptUser() {
  rl.question(chalk.bold('\nYou\n'), handleInput);
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
