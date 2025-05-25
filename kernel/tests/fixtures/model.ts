import { openai } from '@ai-sdk/openai';
import { LanguageModel } from 'ai';
import 'dotenv/config';

export const model: LanguageModel = openai('gpt-4o');
