import { Kernel } from './kernel';
import { openai } from '@ai-sdk/openai';
import 'dotenv/config';

const model = openai('gpt-4-turbo');
const kernel = new Kernel(model);

// Add resources, protocol handlers

kernel.handleInput({ text: 'Write a short poem' });
