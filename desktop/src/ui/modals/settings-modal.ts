import { html, render } from 'lit';
import { ModalSize } from '../../modals/modal';
import { ModalElement } from '../../modals/modal-element';
import { ConfigModel, ConfigData } from '../../core/config';
import { dependencies } from '../../common/dependencies';
import {
  AIModelDescriptor,
  AIModelProviderConfig,
  AIModelProviderName,
  AIModelService,
} from '../../ai/ai-models';
import '../common/textarea';
import '../common/select';
import '../common/input';
import './settings-modal.css';

// Constants for provider names
const AIModelProviderNames = {
  OpenAI: 'openai' as AIModelProviderName,
  Ollama: 'ollama' as AIModelProviderName,
  Anthropic: 'anthropic' as AIModelProviderName,
};

interface ModelInfo {
  name: string;
  provider: AIModelProviderName;
  details?: string;
}

export class SettingsModal extends ModalElement {
  size: ModalSize = 'full';
  private configModel: ConfigModel;
  private aiModelService: AIModelService;

  // Model provider settings
  private selectedProvider: AIModelProviderName = AIModelProviderNames.OpenAI;
  private apiKey: string = '';
  private baseUrl: string = '';
  private availableModels: AIModelDescriptor[] = [];
  private selectedModelId: string = '';
  private isLoadingModels: boolean = false;
  private apiKeyError: string | null = null;
  private selectedModel: AIModelDescriptor | null = null;
  private globalHint: string = '';

  constructor() {
    super();
    this.configModel = dependencies.resolve<ConfigModel>('ConfigModel');
    this.aiModelService =
      dependencies.resolve<AIModelService>('AIModelService');
  }

  connectedCallback() {
    this.initFromConfig();
    this.loadModelsForProvider();

    render(this.template, this);
  }

  initFromConfig() {
    const config = this.configModel.get() as ConfigData;

    // Get selected model if available
    this.selectedModel = config.ai.primaryModel;

    if (this.selectedModel) {
      this.selectedProvider = this.selectedModel
        .provider as AIModelProviderName;
      this.selectedModelId = this.selectedModel.name;
    }

    // Get provider configs
    const openaiConfig = config.ai.providers[AIModelProviderNames.OpenAI];
    const ollamaConfig = config.ai.providers[AIModelProviderNames.Ollama];
    const anthropicConfig = config.ai.providers[AIModelProviderNames.Anthropic];

    // Set API key or base URL based on the selected provider
    if (this.selectedProvider === AIModelProviderNames.OpenAI && openaiConfig) {
      this.apiKey = openaiConfig.apiKey;
    } else if (
      this.selectedProvider === AIModelProviderNames.Ollama &&
      ollamaConfig
    ) {
      this.baseUrl = ollamaConfig.baseUrl;
    } else if (
      this.selectedProvider === AIModelProviderNames.Anthropic &&
      anthropicConfig
    ) {
      this.apiKey = anthropicConfig.apiKey;
    }

    // Get global hint if available
    if (config.ai.globalHint) {
      this.globalHint = config.ai.globalHint;
    }
  }

  handleModelSelect(model: AIModelDescriptor) {
    this.selectedModel = model;

    // Update config with selected model
    this.configModel.updateModelProvider(
      model.provider as AIModelProviderName,
      {
        apiKey: model.provider === 'openai' ? this.apiKey : undefined,
        baseUrl: model.provider === 'ollama' ? this.baseUrl : undefined,
      }
    );

    // Set as primary model
    const config = this.configModel.get() as ConfigData;
    config.ai.primaryModel = model;

    render(this.template, this);
  }

  isModelSelected(model: AIModelDescriptor): boolean {
    if (!this.selectedModel) return false;
    return (
      this.selectedModel.name === model.name &&
      this.selectedModel.provider === model.provider
    );
  }

  handleGlobalHintChange(e: CustomEvent) {
    this.globalHint = e.detail.value;

    // Update config with global hint
    const config = this.configModel.get() as ConfigData;
    config.ai.globalHint = this.globalHint;
  }

  private handleProviderChange = async (event: CustomEvent) => {
    this.selectedProvider = event.detail.value as AIModelProviderName;
    this.selectedModelId = '';
    this.selectedModel = null;

    // Reset API key or base URL based on the selected provider
    const config = this.configModel.get() as ConfigData;
    const providerConfig = config.ai.providers[this.selectedProvider];

    if (
      this.selectedProvider === AIModelProviderNames.OpenAI ||
      this.selectedProvider === AIModelProviderNames.Anthropic
    ) {
      this.apiKey = providerConfig?.apiKey || '';
    } else if (this.selectedProvider === AIModelProviderNames.Ollama) {
      this.baseUrl = providerConfig?.baseUrl || '';
    }

    // Load models for the selected provider
    await this.loadModelsForProvider();

    // Update the UI
    render(this.template, this);
  };

  // Arrow function ensures 'this' is bound correctly in the event handler
  private handleApiKeyChange = (e: CustomEvent) => {
    this.apiKey = e.detail.value;

    // Update config with API key
    this.configModel.updateModelProvider(this.selectedProvider, {
      apiKey: this.apiKey,
    });

    // Reload models with new API key
    this.loadModelsForProvider();
  };

  // Arrow function ensures 'this' is bound correctly in the event handler
  private handleBaseUrlChange = (e: CustomEvent) => {
    this.baseUrl = e.detail.value;

    // Update config with base URL
    this.configModel.updateModelProvider(this.selectedProvider, {
      baseUrl: this.baseUrl,
    });

    // Reload models with new base URL
    this.loadModelsForProvider();
  };

  // Arrow function ensures 'this' is bound correctly in the event handler
  private handleModelChange = async (e: CustomEvent) => {
    this.selectedModelId = e.detail.value;

    // Find the selected model descriptor
    const modelDescriptor = this.availableModels.find(
      (model) => model.name === this.selectedModelId
    );

    if (modelDescriptor) {
      this.selectedModel = modelDescriptor;

      // Update config with selected model
      const config = this.configModel.get() as ConfigData;
      config.ai.primaryModel = modelDescriptor;
    }
  };

  async loadModelsForProvider() {
    this.isLoadingModels = true;
    this.availableModels = [];
    this.apiKeyError = null;

    try {
      let providerConfig: AIModelProviderConfig = {};

      if (
        this.selectedProvider === AIModelProviderNames.OpenAI ||
        this.selectedProvider === AIModelProviderNames.Anthropic
      ) {
        providerConfig = { apiKey: this.apiKey };
      } else if (this.selectedProvider === AIModelProviderNames.Ollama) {
        providerConfig = { baseUrl: this.baseUrl };
      }

      this.availableModels = await this.aiModelService.getAvailableModels(
        this.selectedProvider,
        providerConfig
      );
    } catch (error) {
      console.error('Failed to load models:', error);
      this.apiKeyError =
        error.message || 'Failed to load models. Please check configuration.';
    } finally {
      this.isLoadingModels = false;
      render(this.template, this);
    }
  }

  get globalHintTemplate() {
    return html`
      <div class="setting-group">
        <h3>Global Hint</h3>
        <p>
          Customize how the models respond. These instructions will be sent with
          every command.
        </p>
        <un-textarea
          value=${this.globalHint}
          @input=${this.handleGlobalHintChange}
          rows="4"
        ></un-textarea>
      </div>
    `;
  }

  get modelSelectionTemplate() {
    return html`
      <div class="setting-group">
        <h3>Model</h3>
        <div class="setting-row">
          <label>Provider</label>
          <un-select
            value=${this.selectedProvider}
            @change=${this.handleProviderChange}
          >
            <option value="${AIModelProviderNames.OpenAI}">OpenAI</option>
            <option value="${AIModelProviderNames.Ollama}">Ollama</option>
            <option value="${AIModelProviderNames.Anthropic}">Anthropic</option>
          </un-select>
        </div>

        ${this.selectedProvider === AIModelProviderNames.OpenAI ||
        this.selectedProvider === AIModelProviderNames.Anthropic
          ? html`
              <div class="setting-row">
                <label>API Key</label>
                <un-input
                  type="password"
                  value=${this.apiKey}
                  @change=${this.handleApiKeyChange}
                  placeholder="Enter your API key"
                ></un-input>
              </div>
            `
          : html`
              <div class="setting-row">
                <label>Base URL</label>
                <un-input
                  type="url"
                  value=${this.baseUrl}
                  @change=${this.handleBaseUrlChange}
                ></un-input>
              </div>
            `}

        <div class="setting-row">
          <label>Model</label>
          <un-select
            value=${this.selectedModelId}
            @change=${this.handleModelChange}
            placeholder="Select a model"
            ?disabled=${this.isLoadingModels ||
            this.availableModels.length === 0}
          >
            ${this.isLoadingModels
              ? html`<option value="" disabled>Loading models...</option>`
              : this.availableModels.length === 0
                ? html`<option value="" disabled>No models available</option>`
                : this.availableModels.map(
                    (model) => html`
                      <option value="${model.name}">${model.name}</option>
                    `
                  )}
          </un-select>
        </div>

        ${this.apiKeyError
          ? html`<div class="error">${this.apiKeyError}</div>`
          : ''}
      </div>
    `;
  }

  get template() {
    return html` ${this.globalHintTemplate} ${this.modelSelectionTemplate} `;
  }
}

customElements.define('settings-modal', SettingsModal);
