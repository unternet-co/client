import {
  AIModelDescriptor,
  AIModelProviderConfig,
  AIModelProviderName,
} from './ai/ai-models';
import { Notifier } from './common/notifier';
import { KeyStoreService } from './storage/keystore-service';

export interface ConfigData {
  ai: {
    providers: {
      [id: string]: AIModelProviderConfig;
    };
    primaryModel: AIModelDescriptor | null;
    globalHint: string;
  };
}

export const initConfig: ConfigData = {
  ai: {
    providers: {},
    primaryModel: null,
    globalHint: '',
  },
};

export interface ConfigNotification {
  type: 'model' | 'hint';
}

export class ConfigModel {
  private store: KeyStoreService<ConfigData>;
  private notifier = new Notifier<ConfigNotification>();
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
    this.config.ai.providers[provider] = providerConfig;
    this.store.set(this.config);
    this.notifier.notify();
  }

  updatePrimaryModel(model: AIModelDescriptor) {
    this.config.ai.primaryModel = model;
    this.store.set(this.config);
    this.notifier.notify({ type: 'model' });
  }

  updateGlobalHint(hint: string) {
    this.config.ai.globalHint = hint;
    this.store.set(this.config);
    console.log(this.config);
    this.notifier.notify({ type: 'hint' });
  }

  get() {
    return this.config;
  }
}
