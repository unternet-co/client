import {
  AIModelDescriptor,
  AIModelProvider,
  AIModelProviderConfig,
  ConfigValidationResult,
} from '../ai-models';
import { createOllama } from 'ollama-ai-provider';

export const OLLAMA_BASE_URL = 'http://localhost:11434/api';

export interface OllamaModelDetails {
  format: string;
  family: string;
  families: string[] | null;
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export class OllamaModelProvider implements AIModelProvider {
  async getAvailableModels({
    baseUrl,
  }: AIModelProviderConfig): Promise<AIModelDescriptor[]> {
    baseUrl = baseUrl || OLLAMA_BASE_URL;

    try {
      const response = await fetch(`${baseUrl}/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const { models } = (await response.json()) as OllamaTagsResponse;

      return models.map((model) => ({
        name: model.name,
        provider: 'ollama',
      }));
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      throw error;
    }
  }

  async getModel(
    modelId: string,
    providerConfig: AIModelProviderConfig
  ): Promise<any> {
    const model = createOllama({
      baseURL: providerConfig.baseUrl || OLLAMA_BASE_URL,
    })(modelId);
    return model;
  }

  async validateConfig(
    providerConfig: AIModelProviderConfig
  ): Promise<ConfigValidationResult> {
    // Ollama doesn't require an API key, but it does need a base URL
    // If no baseUrl is provided, we'll use the default
    return { valid: true };
  }
}
