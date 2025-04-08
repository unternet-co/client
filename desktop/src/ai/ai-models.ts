import { LanguageModel } from '@unternet/kernel';
import { OpenAIModelProvider } from './providers/openai';
import { OllamaModelProvider } from './providers/ollama';

export interface AIModelProvider {
  getAvailableModels(
    providerConfig: AIModelProviderConfig
  ): Promise<AIModelDescriptor[]>;
  getModel(
    modelId: string,
    providerConfig: AIModelProviderConfig
  ): Promise<LanguageModel>;
}

export const AIModelProviderNames = {
  openai: 'OpenAI',
  ollama: 'Ollama',
  anthropic: 'Anthropic',
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
}
