import { LanguageModel } from '@unternet/kernel';
import { OpenAIModelProvider } from './providers/openai';
import { OllamaModelProvider } from './providers/ollama';

export interface ConfigValidationResult {
  valid: boolean;
  error?: string;
}

export interface AIModelProvider {
  getAvailableModels(
    providerConfig: AIModelProviderConfig
  ): Promise<AIModelDescriptor[]>;
  getModel(
    modelId: string,
    providerConfig: AIModelProviderConfig
  ): Promise<LanguageModel>;
  validateConfig(
    providerConfig: AIModelProviderConfig
  ): Promise<ConfigValidationResult>;
}

export const AIModelProviderNames = {
  openai: 'OpenAI',
  ollama: 'Ollama',
  // anthropic: 'Anthropic', // TODO: Add Anthropic support
};

export type AIModelProviderName = keyof typeof AIModelProviderNames;

export interface AIModelDescriptor {
  name: string;
  provider: AIModelProviderName;
  description?: string;
}

export interface AIModelProviderConfig {
  apiKey?: string;
  baseUrl?: string;
}

type AIModelProviderMap = { [key in AIModelProviderName]: AIModelProvider };

export class AIModelService {
  private providers: AIModelProviderMap;
  // Restrict to a subset of models for now
  private allowedOpenAiModels: Array<String> = [
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'gpt-4o',
  ];

  constructor(providers: AIModelProviderMap) {
    this.providers = providers;
  }

  async getAvailableModels(
    providerName: AIModelProviderName,
    providerConfig: AIModelProviderConfig
  ): Promise<AIModelDescriptor[]> {
    if (!(providerName in this.providers)) {
      throw new Error(`Provider name '${providerName}' not valid.`);
    }
    return this.providers[providerName].getAvailableModels(providerConfig);
  }

  getModel(
    providerName: AIModelProviderName,
    modelId: string,
    providerConfig: AIModelProviderConfig
  ) {
    if (!(providerName in this.providers)) {
      throw new Error(`Provider name '${providerName}' not valid.`);
    }
    return this.providers[providerName].getModel(modelId, providerConfig);
  }

  async validateProviderConfig(
    providerName: AIModelProviderName,
    providerConfig: AIModelProviderConfig
  ): Promise<ConfigValidationResult> {
    if (!(providerName in this.providers)) {
      return {
        valid: false,
        error: `Provider name '${providerName}' not valid.`,
      };
    }
    return this.providers[providerName].validateConfig(providerConfig);
  }

  getAllowedOpenAiModels() {
    return this.allowedOpenAiModels;
  }
}
