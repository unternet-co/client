/**
 * Service for interacting with the Ollama API
 */

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

const SELECTED_MODEL_KEY = 'ollama_selected_model';
const CACHED_MODELS_KEY = 'ollama_cached_models';
const LAST_FETCH_TIME_KEY = 'ollama_last_fetch_time';

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434/api') {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async isRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error checking Ollama status:', error);
      return false;
    }
  }

  getCachedModels(): OllamaModel[] {
    try {
      const cachedModelsJson = localStorage.getItem(CACHED_MODELS_KEY);
      if (cachedModelsJson) {
        return JSON.parse(cachedModelsJson);
      }
    } catch (error) {
      console.error('Error parsing cached Ollama models:', error);
    }
    return [];
  }

  setCachedModels(models: OllamaModel[]): void {
    try {
      localStorage.setItem(CACHED_MODELS_KEY, JSON.stringify(models));
      localStorage.setItem(LAST_FETCH_TIME_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error caching Ollama models:', error);
    }
  }

  getLastFetchTime(): number {
    const timeStr = localStorage.getItem(LAST_FETCH_TIME_KEY);
    return timeStr ? parseInt(timeStr, 10) : 0;
  }

  async getModels(forceRefresh = false): Promise<OllamaModel[]> {
    // Return cached models if available and not forcing refresh
    if (!forceRefresh) {
      const cachedModels = this.getCachedModels();
      if (cachedModels.length > 0) {
        // Fetch fresh models in the background
        this.refreshModelsInBackground();
        return cachedModels;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaTagsResponse;
      this.setCachedModels(data.models);
      return data.models;
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return this.getCachedModels(); // Fall back to cached models on error
    }
  }

  private async refreshModelsInBackground(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as OllamaTagsResponse;
        this.setCachedModels(data.models);
      }
    } catch (error) {
      console.error('Error refreshing Ollama models in background:', error);
    }
  }

  getSelectedModel(): string | null {
    return localStorage.getItem(SELECTED_MODEL_KEY);
  }

  setSelectedModel(modelName: string): void {
    localStorage.setItem(SELECTED_MODEL_KEY, modelName);
  }

  isModelSelected(modelName: string): boolean {
    return this.getSelectedModel() === modelName;
  }

  static formatModelSize(sizeInBytes: number): string {
    const gigabytes = sizeInBytes / (1024 * 1024 * 1024);
    return `${gigabytes.toFixed(2)} GB`;
  }

  async getFormattedModels(): Promise<
    { name: string; size: string; parameterSize: string }[]
  > {
    const models = await this.getModels();
    return models.map((model) => ({
      name: model.name,
      size: OllamaService.formatModelSize(model.size),
      parameterSize: model.details.parameter_size || 'Unknown',
    }));
  }
}

export const ollamaService = new OllamaService();
