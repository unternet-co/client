import { AIModelProviderConfig } from '../ai/model-provider';
import { AIModelDescriptor, AIModelProviderId } from '../ai/types';
import { Notifier } from '../common/notifier';
import { JsonStoreService } from '../storage/json-store-service';
import { SETTINGS_FILE_NAME } from '../constants';

export interface ConfigData {
  ai: {
    providers: Record<string, AIModelProviderConfig>;
    primaryModel: AIModelDescriptor | null;
    globalHint: string;
  };
  activeWorkspaceId: string | null;
  ui: {
    sidebarVisible: boolean;
    selectedTabIndex: number;
  };
}

export const initConfig: ConfigData = {
  ai: {
    providers: {
      openai: {
        apiKey: '<your-api-key-here>',
        baseUrl: 'https://api.openai.com/v1',
      },
      ollama: {
        baseUrl: 'http://localhost:11434',
      },
    },
    primaryModel: {
      name: 'gpt-4o',
      provider: 'openai',
      description: "GPT-4 Omni - OpenAI's latest multimodal model",
    },
    globalHint: '',
  },
  activeWorkspaceId: null,
  ui: {
    sidebarVisible: true,
    selectedTabIndex: -1,
  },
};

export type ConfigNotification = {
  type: 'model' | 'hint' | 'ui' | 'workspace';
} | null;

export class ConfigService {
  private store = new JsonStoreService(
    SETTINGS_FILE_NAME.replace('.json', ''),
    initConfig
  );
  private notifier = new Notifier<ConfigNotification>();
  readonly subscribe = this.notifier.subscribe;
  private config: ConfigData;

  async load() {
    this.config = await this.store.load();

    // Set up watching for external changes
    this.store.watch((newConfig) => {
      this.config = newConfig;
      this.notifier.notify({ type: 'ui' }); // Notify of external changes
    });

    this.notifier.notify();
  }

  updateModelProviderConfig(
    provider: AIModelProviderId,
    updates: Partial<AIModelProviderConfig>
  ) {
    const currentConfig = this.config.ai.providers[provider];
    this.config.ai.providers[provider] = { ...currentConfig, ...updates };
    this.store
      .set(this.config)
      .catch((err) => console.error('Failed to save config:', err));
    this.notifier.notify({ type: 'model' });
  }

  updateActiveWorkspaceId(id: string | null) {
    this.config.activeWorkspaceId = id;
    this.store
      .set(this.config)
      .catch((err) => console.error('Failed to save config:', err));
    this.notifier.notify({ type: 'workspace' });
  }

  updatePrimaryModel(model: AIModelDescriptor) {
    this.config.ai.primaryModel = model;
    this.store
      .set(this.config)
      .catch((err) => console.error('Failed to save config:', err));
    this.notifier.notify({ type: 'model' });
  }

  updateGlobalHint(hint: string) {
    this.config.ai.globalHint = hint;
    this.store
      .set(this.config)
      .catch((err) => console.error('Failed to save config:', err));
    this.notifier.notify({ type: 'hint' });
  }

  updateSelectedTabIndex(index: number) {
    this.config.ui.selectedTabIndex = index;
    this.store.set(this.config);
    this.notifier.notify({ type: 'ui' });
  }

  toggleSidebar() {
    this.config.ui.sidebarVisible = !this.config.ui.sidebarVisible;
    this.store
      .set(this.config)
      .catch((err) => console.error('Failed to save config:', err));
    this.notifier.notify({ type: 'ui' });
    console.log('ConfigService: notification sent with type "ui"');
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
