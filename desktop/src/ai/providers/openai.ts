import { LanguageModel } from '@unternet/kernel';
import {
  AIModelDescriptor,
  AIModelProvider,
  AIModelProviderConfig,
  ConfigValidationResult,
} from '../models';
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
    if (!providerConfig.apiKey) {
      throw new Error('OpenAI API Key is missing or empty.');
    }

    try {
      const client = new OpenAI({
        apiKey: providerConfig.apiKey,
        dangerouslyAllowBrowser: true,
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
    } catch (error) {
      throw error;
    }
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

  async validateConfig(
    providerConfig: AIModelProviderConfig
  ): Promise<ConfigValidationResult> {
    if (!providerConfig.apiKey) {
      return { valid: false, error: 'OpenAI API Key is required' };
    }
    return { valid: true };
  }
}
