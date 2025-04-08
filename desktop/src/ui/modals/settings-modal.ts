import { html, render, TemplateResult } from 'lit';
import { ModalSize } from '../../modals/modal';
import { ModalElement } from '../../modals/modal-element';
import { ConfigModel, ConfigData } from '../../core/config';
import { dependencies } from '../../common/dependencies';
import {
  AIModelDescriptor,
  AIModelProviderConfig,
  AIModelProviderName,
  AIModelService,
  AIModelProviderNames,
} from '../../ai/ai-models';
import '../common/textarea';
import '../common/select';
import '../common/input';
import './settings-modal.css';

export class SettingsModal extends ModalElement {
  size: ModalSize = 'full';
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
  private apiKeyError: string | null = null;

  connectedCallback() {
    this.configModel = dependencies.resolve<ConfigModel>('ConfigModel');
    this.aiModelService =
      dependencies.resolve<AIModelService>('AIModelService');

    // Update values from the config
    const config = this.configModel.get();
    this.globalHint = config.ai.globalHint;
    this.selectedProvider = config.ai.primaryModel?.provider || 'openai';
    this.selectedProviderConfig = config.ai.providers[this.selectedProvider];
    this.selectedModel = config.ai.primaryModel;

    this.render();
    this.updateProviderModels();
  }

  private handleSubmit() {
    this.configModel.updateGlobalHint(this.globalHint);
    this.configModel.updateModelProvider(
      this.selectedProvider,
      this.selectedProviderConfig
    );
    this.configModel.updatePrimaryModel(this.selectedModel);
  }

  private handleProviderChange = async (event: CustomEvent) => {
    const selectedProvider = event.detail.value as AIModelProviderName;

    // Get the provider API key if one has already been stored
    const config = this.configModel.get() as ConfigData;
    this.selectedProvider = selectedProvider;
    const providerConfig = config.ai.providers[selectedProvider];
    this.render();

    if (providerConfig.apiKey || providerConfig.baseUrl) {
      this.updateProviderModels();
    }
  };

  async updateProviderModels() {
    try {
      this.availableModels = await this.aiModelService.getAvailableModels(
        this.selectedProvider,
        this.selectedProviderConfig
      );
    } catch (error) {
      console.error('Failed to load models:', error);
      this.apiKeyError =
        error.message || 'Failed to load models. Please check configuration.';
    } finally {
      this.isLoadingModels = false;
      this.render();
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
          @change=${(event: CustomEvent) =>
            (this.globalHint = event.detail.value)}
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
        <label>Provider</label>
        <un-select
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
    if (this.selectedProvider === AIModelProviderNames.ollama) {
      const ollamaDetails = html`
        <div class="setting-row">
          <label>Base URL</label>
          <un-input
            type="url"
            value=${this.selectedProviderConfig.baseUrl}
            @change=${(e: CustomEvent) => {
              this.selectedProviderConfig.baseUrl = e.detail.value;
            }}
            @blur=${this.updateProviderModels.bind(this)}
          ></un-input>
        </div>
      `;
      sections.push(ollamaDetails);
    } else {
      const hostedModelDetails = html`
        <div class="setting-row">
          <label>API Key</label>
          <un-input
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

    // Individual model selection
    const modelSelection = html`
      <div class="setting-row">
        <label>Model</label>
        <un-select
          value=${this.selectedModel?.name}
          @change=${(event: CustomEvent) => {
            this.selectedModel = this.availableModels.find(
              (model) => model.name === event.detail.value
            );
          }}
          placeholder="Select a model"
          ?disabled=${this.isLoadingModels || this.availableModels.length === 0}
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
    `;
    sections.push(modelSelection);

    if (this.apiKeyError) {
      sections.push(html`<div class="error">${this.apiKeyError}</div>`);
    }

    // Full template
    return html`
      <div class="setting-group">
        <h3>Model</h3>
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
