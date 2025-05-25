import { LanguageModel } from '@unternet/kernel';
import { AIModelDescriptor } from './types';

export interface AIModelProviderConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  error?: string;
}

export interface AIModelProvider {
  getAvailableModels(
    providerConfig: AIModelProviderConfig
  ): Promise<AIModelDescriptor[]>;

  resolveModel(
    modelId: string,
    providerConfig: AIModelProviderConfig
  ): LanguageModel;

  validateConfig(providerConfig: AIModelProviderConfig): ConfigValidationResult;
}
