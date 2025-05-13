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
    globalHint: string;
  };
  activeWorkspaceId: string | null;
}

export const initConfig: ConfigData = {
  ai: {
    providers: {},
    primaryModel: null,
    globalHint: '',
  },
  activeWorkspaceId: null,
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
  }

  async load() {
    this.config = this.store.get();
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

  updateActiveWorkspaceId(id: string | null) {
    this.config.activeWorkspaceId = id;
    this.store.set(this.config);
  }

  updatePrimaryModel(model: AIModelDescriptor) {
    this.config.ai.primaryModel = model;
    this.store.set(this.config);
    this.notifier.notify({ type: 'model' });
  }

  updateGlobalHint(hint: string) {
    this.config.ai.globalHint = hint;
    this.store.set(this.config);
    this.notifier.notify({ type: 'hint' });
  }

  get(): ConfigData;
  get<K extends keyof ConfigData>(key: K): ConfigData[K];
  get<K extends keyof ConfigData>(key?: K) {
    if (key !== undefined) {
      return this.config[key];
    }
    return this.config;
  }
}
