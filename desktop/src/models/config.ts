import { Notifier } from '../base/notifier';
import { KeyStoreService } from '../services/keystore-service';

export interface ModelConfig {
  type: 'openai' | 'anthropic' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ConfigData {
  model: ModelConfig | null;
}

export const initConfig: ConfigData = {
  model: null,
};

export class ConfigModel {
  private store: KeyStoreService<ConfigData>;
  private notifier = new Notifier();
  readonly subscribe = this.notifier.subscribe;
  private config: ConfigData;

  constructor(store: KeyStoreService<ConfigData>) {
    this.config = store.get();
    this.notifier.notify();
  }

  updateModel(model: ModelConfig) {
    this.store.update({ model });
    this.notifier.notify();
  }

  get(key?: keyof ModelConfig) {
    if (key) return this.config[key];
    return this.config;
  }
}
