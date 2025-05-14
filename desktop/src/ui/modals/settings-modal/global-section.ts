import { html, render, TemplateResult } from 'lit';
import { dependencies } from '../../../common/dependencies';
import { ConfigModel, ConfigData } from '../../../models/config-model';
import {
  AIModelDescriptor,
  AIModelProviderConfig,
  AIModelProviderName,
  AIModelService,
  AIModelProviderNames,
} from '../../../ai/ai-models';
import { OLLAMA_BASE_URL } from '../../../ai/providers/ollama';
import '../../common/textarea';
import '../../common/select';
import '../../common/input';
import '../../common/label';
import '../../common/button';

import { ChangeEvent } from '../../common/select';

export const globalSectionDef = {
  key: 'global',
  label: 'Global',
  render: () => html`<global-section></global-section>`,
};

export class GlobalSection extends HTMLElement {
  #configModel: ConfigModel;
  #aiModelService: AIModelService;
  #globalHint: string = '';
  #selectedProvider?: AIModelProviderName;
  #selectedProviderConfig?: AIModelProviderConfig;
  #availableModels: AIModelDescriptor[] = [];
  #selectedModel: AIModelDescriptor = null;
  #isLoadingModels: boolean = false;
  #modelError: string | null = null;

  constructor() {
    super();
    this.#configModel = dependencies.resolve<ConfigModel>('ConfigModel');
    this.#aiModelService =
      dependencies.resolve<AIModelService>('AIModelService');
    this.#initializeFromConfig();
  }

  connectedCallback() {
    this.render();
    this.#updateProviderModels();
  }

  #initializeFromConfig() {
    const config = this.#configModel.get() as ConfigData;
    this.#globalHint = config.ai.globalHint || '';
    this.#selectedProvider = config.ai.primaryModel?.provider || 'openai';
    if (!config.ai.providers[this.#selectedProvider]) {
      config.ai.providers[this.#selectedProvider] = { apiKey: '', baseUrl: '' };
    }
    this.#selectedProviderConfig = config.ai.providers[this.#selectedProvider];
    this.#selectedModel = config.ai.primaryModel || {
      provider: this.#selectedProvider,
      name: '',
    };
  }

  #handleHintInput = () => {
    this.#configModel.updateGlobalHint(this.#globalHint);
  };

  #handleProviderChange = async (event: ChangeEvent) => {
    this.#selectedModel = null;
    this.#modelError = null;
    const selectedProvider = event.value as AIModelProviderName;
    this.#selectedProvider = selectedProvider;
    const config = this.#configModel.get() as ConfigData;
    if (!config.ai.providers[selectedProvider]) {
      config.ai.providers[selectedProvider] = { apiKey: '', baseUrl: '' };
    }
    this.#selectedProviderConfig = config.ai.providers[selectedProvider];
    await this.#updateProviderModels();
  };

  #handleModelChange = (event: ChangeEvent) => {
    const modelName = event.value;
    this.#selectedModel = this.#availableModels.find(
      (model) => model.name === modelName
    ) || {
      provider: this.#selectedProvider,
      name: modelName,
    };
    this.render();
  };

  async #updateProviderModels() {
    if (!this.#selectedProvider || !this.#selectedProviderConfig) {
      this.#isLoadingModels = false;
      this.render();
      return;
    }
    const validation = await this.#aiModelService.validateProviderConfig(
      this.#selectedProvider,
      this.#selectedProviderConfig
    );
    if (!validation.valid) {
      this.#availableModels = [];
      this.#isLoadingModels = false;
      this.render();
      return;
    }
    try {
      this.#isLoadingModels = true;
      this.render();
      const allAvailableModels = await this.#aiModelService.getAvailableModels(
        this.#selectedProvider,
        this.#selectedProviderConfig
      );
      this.#availableModels =
        this.#selectedProvider === 'openai'
          ? allAvailableModels.filter((model) =>
              this.#aiModelService.getAllowedOpenAiModels().includes(model.name)
            )
          : allAvailableModels;
      this.#modelError = null;
    } catch (error) {
      console.error('Failed to load models:', error);
      this.#modelError =
        error.message || 'Failed to load models. Please check configuration.';
      this.#availableModels = [];
    } finally {
      this.#isLoadingModels = false;
      this.render();
    }
  }

  #handleProviderConfigChange = (
    field: 'apiKey' | 'baseUrl',
    value: string
  ) => {
    this.#selectedProviderConfig[field] = value;
  };

  #handleProviderConfigBlur = () => {
    this.#updateProviderModels();
  };

  #handleSave = () => {
    this.#configModel.updateGlobalHint(this.#globalHint);
    this.#configModel.updateModelProvider(
      this.#selectedProvider,
      this.#selectedProviderConfig
    );
    this.#configModel.updatePrimaryModel(this.#selectedModel);
  };

  public rerender() {
    this.render();
  }

  get #globalHintTemplate() {
    return html`
      <fieldset>
        <legend>Global Hint</legend>
        <p>
          Customize how the models respond. These instructions will be sent with
          every command.
        </p>
        <un-textarea
          .value=${this.#globalHint}
          @change=${this.#handleHintInput}
          rows="4"
        ></un-textarea>
      </fieldset>
    `;
  }

  get #modelSelectionTemplate() {
    const sections: TemplateResult[] = [];
    // Provider select
    const providerSelection = html`
      <div class="setting-row">
        <un-label for="provider" text="Provider"></un-label>
        <un-select
          id="provider"
          .value=${this.#selectedProvider}
          @change=${this.#handleProviderChange}
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
    if (this.#selectedProvider === 'ollama') {
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
            .value=${this.#selectedProviderConfig.baseUrl}
            @change=${(e: ChangeEvent) =>
              this.#handleProviderConfigChange('baseUrl', e.value)}
            @blur=${this.#handleProviderConfigBlur}
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
            .value=${this.#selectedProviderConfig.apiKey}
            @change=${(e: ChangeEvent) =>
              this.#handleProviderConfigChange('apiKey', e.value)}
            @blur=${this.#handleProviderConfigBlur}
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
          .value=${this.#selectedModel?.name || ''}
          @change=${this.#handleModelChange}
          ?loading=${this.#isLoadingModels}
          placeholder="Select a model"
        >
          ${this.#availableModels.map(
            (model) =>
              html`<option value="${model.name}">${model.name}</option>`
          )}
        </un-select>
      </div>
    `;
    sections.push(modelSelection);
    if (this.#modelError) {
      sections.push(
        html`<div class="model-error">
          <un-icon name="error"></un-icon>
          <span>${this.#modelError}</span>
        </div>`
      );
    } else if (!this.#selectedModel?.name) {
      sections.push(
        html`<div class="model-error">
          <un-icon name="error"></un-icon>
          <span>Please select a model</span>
        </div>`
      );
    }
    return html`
      <fieldset>
        <legend>Model</legend>
        ${sections}
      </fieldset>
    `;
  }

  render() {
    const template = html`
      <form>
        <h3>Global Settings</h3>
        <fieldset>These settings apply to all workspaces.</fieldset>
        ${this.#globalHintTemplate} ${this.#modelSelectionTemplate}
      </form>
    `;
    render(template, this);
  }
}

if (!customElements.get('global-section')) {
  customElements.define('global-section', GlobalSection);
}
