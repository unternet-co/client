import { LanguageModel } from '@unternet/kernel';
import {
  AIModelDescriptor,
  AIModelProvider,
  AIModelProviderConfig,
} from '../ai-models';
import { OpenAI } from 'openai';
import { createOpenAI } from '@ai-sdk/openai';

const OPENAI_MODEL_EXCLUDE_PATTERNS = [
  'whisper',
  'tts',
  'dall-e',
  'embedding',
  'moderation',
];

export class OpenAIModelProvider implements AIModelProvider {
  async getAvailableModels(
    providerConfig: AIModelProviderConfig
  ): Promise<AIModelDescriptor[]> {
    const client = new OpenAI({
      apiKey: providerConfig.apiKey,
    });

    const { data: models } = await client.models.list();

    function modelFilter(model: OpenAI.Models.Model) {
      const shouldExclude = OPENAI_MODEL_EXCLUDE_PATTERNS.some((pattern) =>
        model.id.toLowerCase().includes(pattern)
      );
      return !shouldExclude;
    }

    return models.filter(modelFilter).map((model) => ({
      name: model.id,
      provider: 'openai',
    }));
  }

  async getModel(
    modelId: string,
    providerConfig: AIModelProviderConfig
  ): Promise<LanguageModel> {
    return createOpenAI({
      apiKey: providerConfig.apiKey,
      compatibility: 'strict',
    })(modelId);
  }
}
