import { Kernel } from './kernel';
import { openai } from '@ai-sdk/openai';
import 'dotenv/config';

const greeter = {
  uri: 'greeter',
  protocol: 'function',
  actions: {
    say_hello: {
      description: 'Says hello to the user',
    },
  },
};

const model = openai('gpt-4-turbo');
const kernel = new Kernel({ model, resources: [greeter] });

// Add resources, protocol handlers

kernel.handleInput({
  text: 'Say hello to the user, using the greeter function',
});
