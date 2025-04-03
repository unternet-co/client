/**
 * Service for interacting with the OpenAI API
 */

export interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface OpenAIModelsResponse {
  data: OpenAIModel[];
  object: string;
}

// Local storage keys
const OPENAI_API_KEY_KEY = 'openai_api_key';
const SELECTED_OPENAI_MODEL_KEY = 'openai_selected_model';

export class OpenAIService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://api.openai.com/v1') {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getApiKey(): string | null {
    return localStorage.getItem(OPENAI_API_KEY_KEY);
  }

  setApiKey(apiKey: string): void {
    localStorage.setItem(OPENAI_API_KEY_KEY, apiKey);
  }

  clearApiKey(): void {
    localStorage.removeItem(OPENAI_API_KEY_KEY);
  }

  async getModels(): Promise<OpenAIModel[]> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.error('No OpenAI API key found');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to fetch models: ${response.status} ${response.statusText}\nResponse: ${errorText}`
        );

        // Check specifically for invalid API key error
        if (response.status === 401) {
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            // If JSON parsing fails, continue with generic error
          }

          if (errorData?.error?.code === 'invalid_api_key') {
            throw new Error('invalid_api_key');
          }
        }

        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = (await response.json()) as OpenAIModelsResponse;

      // These types aren't relevant to client, atm
      const excludePatterns = [
        'whisper',
        'tts',
        'dall-e',
        'embedding',
        'moderation',
      ];

      const filteredModels = data.data.filter((model) => {
        const shouldExclude = excludePatterns.some((pattern) =>
          model.id.toLowerCase().includes(pattern)
        );

        return !shouldExclude;
      });

      const models = filteredModels.length > 0 ? filteredModels : data.data;
      return models;
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      if (error instanceof Error && error.message === 'invalid_api_key') {
        throw error;
      }
      return [];
    }
  }

  getSelectedModel(): string {
    return localStorage.getItem(SELECTED_OPENAI_MODEL_KEY) || 'gpt-4o';
  }

  setSelectedModel(modelName: string): void {
    localStorage.setItem(SELECTED_OPENAI_MODEL_KEY, modelName);
  }

  isModelSelected(modelName: string): boolean {
    return this.getSelectedModel() === modelName;
  }

  isConfigured(): boolean {
    return !!this.getApiKey();
  }
}

export const openaiService = new OpenAIService();
