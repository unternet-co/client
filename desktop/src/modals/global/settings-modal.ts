import { html, render, TemplateResult } from 'lit';
import { ModalElement, ModalOptions } from '../modal-element';
import { ConfigModel, ConfigData } from '../../config';
import { dependencies } from '../../common/dependencies';
import {
  AIModelDescriptor,
  AIModelProviderConfig,
  AIModelProviderName,
  AIModelService,
  AIModelProviderNames,
} from '../../ai/ai-models';
import '../../ui/common/elements/textarea';
import '../../ui/common/elements/select';
import '../../ui/common/elements/input';
import '../../ui/common/elements/label';
import './settings-modal.css';
import { OLLAMA_BASE_URL } from '../../ai/providers/ollama';

export class SettingsModal extends ModalElement {
  private configModel: ConfigModel;
  private aiModelService: AIModelService;

  // Model hint settings
  private globalHint: string = '';

  // Model provider settings
  private selectedProvider?: AIModelProviderName;
  private selectedProviderConfig?: AIModelProviderConfig;
  private availableModels: AIModelDescriptor[] = [];
  private selectedModel: AIModelDescriptor;
  private isLoadingModels: boolean = false;
  private modelError: string | null = null;

  constructor() {
    super({
      title: 'Global Settings',
    } as ModalOptions);
  }

  connectedCallback() {
    this.configModel = dependencies.resolve<ConfigModel>('ConfigModel');
    this.aiModelService =
      dependencies.resolve<AIModelService>('AIModelService');

    // Update values from the config
    const config = this.configModel.get();
    this.globalHint = config.ai.globalHint || '';
    this.selectedProvider = config.ai.primaryModel?.provider || 'openai';

    // Initialize provider config with defaults if not present
    if (!config.ai.providers[this.selectedProvider]) {
      config.ai.providers[this.selectedProvider] = { apiKey: '', baseUrl: '' };
    }
    this.selectedProviderConfig = config.ai.providers[this.selectedProvider];

    // Initialize selected model if not present
    this.selectedModel = config.ai.primaryModel || {
      provider: this.selectedProvider,
      name: '',
    };

    this.render();
    this.updateProviderModels();
  }

  private handleSubmit() {
    console.log('here');
    this.configModel.updateGlobalHint(this.globalHint);
    this.configModel.updateModelProvider(
      this.selectedProvider,
      this.selectedProviderConfig
    );
    this.configModel.updatePrimaryModel(this.selectedModel);
    this.close();
  }

  private handleHintInput(event: InputEvent) {
    const target = event.target as HTMLTextAreaElement;
    this.globalHint = target.value;
  }

  private handleProviderChange = async (event: CustomEvent) => {
    this.selectedModel = null;
    this.modelError = null;
    const selectedProvider = event.detail.value as AIModelProviderName;

    // Get the provider API key if one has already been stored
    const config = this.configModel.get() as ConfigData;
    this.selectedProvider = selectedProvider;

    // Initialize provider config with defaults if not present
    if (!config.ai.providers[selectedProvider]) {
      config.ai.providers[selectedProvider] = { apiKey: '', baseUrl: '' };
    }

    const providerConfig = config.ai.providers[selectedProvider];
    this.selectedProviderConfig = providerConfig;
    this.updateProviderModels();
  };

  async updateProviderModels() {
    if (!this.selectedProvider || !this.selectedProviderConfig) {
      this.isLoadingModels = false;
      this.render();
      return;
    }

    // Validate the provider configuration
    const validation = await this.aiModelService.validateProviderConfig(
      this.selectedProvider,
      this.selectedProviderConfig
    );

    if (!validation.valid) {
      this.availableModels = [];
      this.isLoadingModels = false;
      this.render();
      return;
    }

    try {
      this.isLoadingModels = true;
      this.render();

      this.availableModels = await this.aiModelService.getAvailableModels(
        this.selectedProvider,
        this.selectedProviderConfig
      );

      this.modelError = null;
    } catch (error) {
      console.error('Failed to load models:', error);
      this.modelError =
        error.message || 'Failed to load models. Please check configuration.';
      this.availableModels = [];
    } finally {
      this.isLoadingModels = false;
      this.render();
    }
  }

  get globalHintTemplate() {
    return html`
      <div class="setting-group">
        <h4>Global Hint</h4>
        <p>
          Customize how the models respond. These instructions will be sent with
          every command.
        </p>
        <un-textarea
          value=${this.globalHint}
          @input=${this.handleHintInput.bind(this)}
          rows="4"
        ></un-textarea>
      </div>
    `;
  }

  get modelSelectionTemplate() {
    const sections: TemplateResult[] = [];

    // Model select
    const providerSelection = html`
      <div class="setting-row">
        <un-label for="provider" text="Provider"></un-label>
        <un-select
          id="provider"
          value=${this.selectedProvider}
          @change=${this.handleProviderChange}
        >
          ${Object.keys(AIModelProviderNames).map((key) => {
            return html`<option value=${key}>
              ${AIModelProviderNames[key]}
            </option>`;
          })}
        </un-select>
      </div>
    `;
    sections.push(providerSelection);

    // Model base URL / API key details
    if (this.selectedProvider === 'ollama') {
      const ollamaDetails = html`
        <div class="setting-row">
          <un-label
            for="base-url"
            text="Base URL"
            hint="The URL where your Ollama server is running"
          ></un-label>
          <un-input
            id="base-url"
            type="url"
            value=${this.selectedProviderConfig.baseUrl}
            @change=${(e: CustomEvent) => {
              this.selectedProviderConfig.baseUrl = e.detail.value;
            }}
            @blur=${this.updateProviderModels.bind(this)}
            placeholder=${OLLAMA_BASE_URL}
          ></un-input>
        </div>
      `;
      sections.push(ollamaDetails);
    } else {
      const hostedModelDetails = html`
        <div class="setting-row">
          <un-label for="api-key" text="API Key" variant="required"></un-label>
          <un-input
            id="api-key"
            type="password"
            value=${this.selectedProviderConfig.apiKey}
            @change=${(e: CustomEvent) => {
              this.selectedProviderConfig.apiKey = e.detail.value;
            }}
            @blur=${this.updateProviderModels.bind(this)}
            placeholder="Enter your API key"
          ></un-input>
        </div>
      `;
      sections.push(hostedModelDetails);
    }

    const modelSelection = html`
      <div class="setting-row">
        <un-label for="model" text="Model"></un-label>
        <un-select
          id="model"
          value=${this.selectedModel?.name}
          @change=${(event: CustomEvent) => {
            this.selectedModel = this.availableModels.find(
              (model) => model.name === event.detail.value
            );
            this.render();
          }}
          ?loading=${this.isLoadingModels}
          placeholder="Select a model"
        >
          ${this.availableModels.map(
            (model) => html`
              <option value="${model.name}">${model.name}</option>
            `
          )}
        </un-select>
      </div>
    `;

    sections.push(modelSelection);

    if (this.modelError) {
      sections.push(
        html`<div class="model-error">
          <un-icon name="error"></un-icon>
          <span>${this.modelError}</span>
        </div>`
      );
    } else if (!this.selectedModel?.name) {
      sections.push(
        html`<div class="model-error">
          <un-icon name="error"></un-icon>
          <span>Please select a model</span>
        </div>`
      );
    }

    return html`
      <div class="setting-group">
        <h4>Model</h4>
        ${sections}
      </div>
    `;
  }

  get controlsTemplate() {
    return html`
      <div class="setting-group">
        <un-button
          text="Save"
          @click=${this.handleSubmit.bind(this)}
        ></un-button>
      </div>
    `;
  }

  render() {
    const sections = [
      this.globalHintTemplate,
      this.modelSelectionTemplate,
      this.controlsTemplate,
    ];
    render(sections, this);
  }
}

customElements.define('settings-modal', SettingsModal);
