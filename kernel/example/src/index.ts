import { Kernel } from './kernel';
import { openai } from '@ai-sdk/openai';
import 'dotenv/config';
import { ResourceMap } from '../../src';

const greeter = {
  uri: 'greeter',
  protocol: 'function',
  actions: {
    say_hello: {
      description: 'Says hello to the user',
    },
  },
};

const initResources = new ResourceMap();
initResources.add(greeter);

const model = openai('gpt-4-turbo');
const kernel = new Kernel({ model, resources: initResources });

// Add resources, protocol handlers

kernel.handleInput({ text: 'Write a short poem' });
