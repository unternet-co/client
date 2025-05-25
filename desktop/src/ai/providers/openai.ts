import { LanguageModel } from '@unternet/kernel';
import { OpenAI } from 'openai';
import { createOpenAI } from '@ai-sdk/openai';
import {
  AIModelProvider,
  AIModelProviderConfig,
  ConfigValidationResult,
} from '../model-provider';
import { AIModelDescriptor } from '../types';

export class OpenAIModelProvider implements AIModelProvider {
  allowedOpenAiModels = [
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'gpt-4o',
  ];

  async getAvailableModels(
    providerConfig: AIModelProviderConfig
  ): Promise<AIModelDescriptor[]> {
    if (!providerConfig.apiKey) {
      throw new Error('OpenAI API Key is missing or empty.');
    }

    const client = new OpenAI({
      apiKey: providerConfig.apiKey,
      dangerouslyAllowBrowser: true,
    });

    const { data: models } = await client.models.list();

    return models
      .filter((model) =>
        this.allowedOpenAiModels.includes(model.id.toLowerCase())
      )
      .map((model) => ({
        name: model.id,
        provider: 'openai',
      }));
  }

  resolveModel(
    modelId: string,
    providerConfig: AIModelProviderConfig
  ): LanguageModel {
    return createOpenAI({
      apiKey: providerConfig.apiKey,
      compatibility: 'strict',
    })(modelId);
  }

  validateConfig(
    providerConfig: AIModelProviderConfig
  ): ConfigValidationResult {
    if (!providerConfig.apiKey) {
      return { valid: false, error: 'OpenAI API Key is required' };
    }
    return { valid: true };
  }
}
