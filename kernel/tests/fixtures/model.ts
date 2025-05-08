import { openai } from '@ai-sdk/openai';
import 'dotenv/config';

export const model = openai('gpt-4o');
