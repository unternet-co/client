import { ConfigService } from '../config/config-service';
import {
  AIModelProvider,
  AIModelProviderConfig,
  ConfigValidationResult,
} from './model-provider';
import { AIModelDescriptor, AIModelProviderId } from './types';

/**
 * Used to register new model providers, retrieve available models from them,
 * validate config, and resolve the model object for the kernel.
 */
export class AIModelService {
  constructor(
    private configService: ConfigService,
    private providers: Record<AIModelProviderId, AIModelProvider>
  ) {}

  registerProvider(id: AIModelProviderId, provider: AIModelProvider) {
    this.providers[id] = provider;
  }

  resolveProvider(id: AIModelProviderId) {
    return this.providers[id];
  }

  async getAvailableModels(
    id: AIModelProviderId
  ): Promise<AIModelDescriptor[]> {
    if (!(id in this.providers)) {
      throw new Error(`Provider name '${id}' not valid.`);
    }
    const config = this.configService.get('ai').providers[id];
    return await this.providers[id].getAvailableModels(config);
  }

  resolveModel(providerId: AIModelProviderId, modelId: string) {
    if (!(providerId in this.providers)) {
      throw new Error(`Provider name '${providerId}' not valid.`);
    }
    const config = this.configService.get('ai').providers[providerId];
    return this.providers[providerId].resolveModel(modelId, config);
  }

  validateConfig(id: AIModelProviderId): ConfigValidationResult {
    if (!(id in this.providers)) {
      return {
        valid: false,
        error: `Provider name '${id}' not valid.`,
      };
    }

    const config = this.configService.get('ai').providers[id];
    return this.providers[id].validateConfig(config);
  }
}
