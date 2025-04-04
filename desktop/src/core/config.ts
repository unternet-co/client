import {
  AIModelDescriptor,
  AIModelProviderConfig,
  AIModelProviderName,
} from '../ai/ai-models';
import { Notifier } from '../common/notifier';
import { KeyStoreService } from '../storage/keystore-service';

export interface ConfigData {
  ai: {
    providers: {
      [id: string]: AIModelProviderConfig;
    };
    primaryModel: AIModelDescriptor | null;
  };
}

export const initConfig: ConfigData = {
  ai: {
    providers: {},
    primaryModel: null,
  },
};

export class ConfigModel {
  private store: KeyStoreService<ConfigData>;
  private notifier = new Notifier();
  readonly subscribe = this.notifier.subscribe;
  private config: ConfigData;

  constructor(store: KeyStoreService<ConfigData>) {
    this.store = store;
    this.config = store.get();
    this.notifier.notify();
  }

  updateModelProvider(
    provider: AIModelProviderName,
    providerConfig: AIModelProviderConfig
  ) {
    this.store.update((config) => {
      return (config.ai.providers[provider] = providerConfig);
    });
    this.notifier.notify();
  }

  get(key?: keyof ConfigData) {
    if (key) return this.config[key];
    return this.config;
  }
}
