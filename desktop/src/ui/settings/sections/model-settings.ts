import { html, HTMLTemplateResult } from 'lit';
import { dependencies } from '../../../common/dependencies';
import { ConfigService } from '../../../config/config-service';
import { SettingsSection } from '../settings-section';
import { ChangeEvent } from '../../common/elements/select';
import { AI_MODEL_PROVIDERS, ERROR_MESSAGES } from '../../../constants';
import { AIModelDescriptor, AIModelProviderId } from '../../../ai/types';
import { AIModelService } from '../../../ai/model-service';
import { AIModelProviderConfig } from '../../../ai/model-provider';
import { OLLAMA_BASE_URL } from '../../../ai/providers/ollama';

export class ModelSettingsSection extends SettingsSection {
  aiModelService = dependencies.resolve<AIModelService>('AIModelService');
  configService = dependencies.resolve<ConfigService>('ConfigService');
  selectedProvider: AIModelProviderId;
  availableModels: AIModelDescriptor[] = [];
  selectedModel: AIModelDescriptor | null = null;
  isLoadingModels: boolean = false;
  errorMessage: string | null = null;

  description = `
    Models are what power the intelligence behind Unternet Shell. You can select\
    from any of the providers below, and for total privacy you can install Ollama
    to access local models. In order to set up a model, you will need to download
    Ollama or get an API key for one of the hosted providers.
  `;

  constructor() {
    super('Model selection');
    this.initialize();
  }

  get selectedProviderConfig() {
    if (!this.selectedProvider) return null;
    return this.configService.get('ai').providers[this.selectedProvider];
  }

  async initialize() {
    const config = this.configService.get('ai');

    this.selectedProvider =
      config.primaryModel?.provider ||
      (Object.keys(AI_MODEL_PROVIDERS)[0] as AIModelProviderId);

    await this.loadModels();

    this.selectedModel = config.primaryModel || null;

    this.render();
  }

  /* INTERACTION HANDLERS */

  async handleProviderChange(event: ChangeEvent) {
    this.selectedModel = null;
    this.errorMessage = null;
    this.selectedProvider = event.value as AIModelProviderId;
    await this.loadModels();
    this.render();
  }

  async loadModels() {
    // Validate the current config, to ensure we can fetch models
    const validation = this.aiModelService.validateConfig(
      this.selectedProvider
    );

    if (!validation.valid) {
      // Render the view, and allow the user to update the config
      this.availableModels = [];
      this.isLoadingModels = false;
      this.render();
      return;
    }

    this.isLoadingModels = true;
    try {
      this.availableModels = await this.aiModelService.getAvailableModels(
        this.selectedProvider
      );
    } catch (error) {
      this.errorMessage = error.message || ERROR_MESSAGES.modelLoad;
      this.availableModels = [];
    }

    this.isLoadingModels = false;
  }

  async updateProviderConfig(updates: Partial<AIModelProviderConfig>) {
    console.log('update received', updates);
    this.configService.updateModelProviderConfig(
      this.selectedProvider,
      updates
    );
    await this.loadModels();
    this.render();
  }

  handleModelChange = (event: ChangeEvent) => {
    const modelName = event.value;
    this.selectedModel = {
      provider: this.selectedProvider,
      name: modelName,
    };
    this.configService.updatePrimaryModel(this.selectedModel);
    this.render();
  };

  /* TEMPLATES */

  get template() {
    const rows: Array<HTMLTemplateResult> = [];

    rows.push(this.descriptionTemplate);
    rows.push(this.providerSelectionTemplate);

    if (this.selectedProvider === 'ollama') {
      rows.push(this.ollamaModelConfigTemplate);
    } else {
      rows.push(this.hostedModelConfigTemplate);
    }

    rows.push(this.modelSelectionTemplate);

    if (this.errorMessage) rows.push(this.errorTemplate);

    return rows;
  }

  get descriptionTemplate() {
    return html`<div class="settings-description">${this.description}</div>`;
  }

  get providerSelectionTemplate() {
    const options: HTMLTemplateResult[] = [];
    for (const key in AI_MODEL_PROVIDERS) {
      options.push(
        html`<option value=${key}>${AI_MODEL_PROVIDERS[key]}</option>`
      );
    }

    return html`
      <div class="settings-row">
        <un-label for="provider" text="Provider"></un-label>
        <un-select
          id="provider"
          .value=${this.selectedProvider}
          @change=${this.handleProviderChange.bind(this)}
        >
          ${options}
        </un-select>
      </div>
    `;
  }

  get ollamaModelConfigTemplate() {
    return html`
      <div class="settings-row">
        <un-label
          for="base-url"
          text="Base URL"
          hint="The URL where your Ollama server is running"
        ></un-label>
        <un-input
          id="base-url"
          type="url"
          .value=${this.selectedProviderConfig.baseUrl}
          @change=${(e: ChangeEvent) => {
            this.updateProviderConfig({ baseUrl: e.value });
          }}
          placeholder=${OLLAMA_BASE_URL}
        ></un-input>
      </div>
    `;
  }

  get hostedModelConfigTemplate() {
    return html`
      <div class="settings-row">
        <un-label for="api-key" text="API Key" variant="required"></un-label>
        <un-input
          id="api-key"
          type="password"
          .value=${this.selectedProviderConfig.apiKey}
          @change=${(e: ChangeEvent) =>
            this.updateProviderConfig({ apiKey: e.value })}
          placeholder="Enter your API key"
        ></un-input>
      </div>
    `;
  }

  get modelSelectionTemplate() {
    const options = this.availableModels.map(
      (model) => html`<option value="${model.name}">${model.name}</option>`
    );

    console.log(this.selectedModel, options);

    return html`
      <div class="settings-row">
        <un-label for="model" text="Model"></un-label>
        <un-select
          id="model"
          .value=${this.selectedModel?.name || ''}
          @change=${this.handleModelChange.bind(this)}
          ?loading=${this.isLoadingModels}
          placeholder="Select a model"
        >
          ${options}
        </un-select>
      </div>
    `;
  }

  get errorTemplate() {
    return html` <div class="settings-error">
      <un-icon name="error"></un-icon>
      <span>${this.errorMessage}</span>
    </div>`;
  }

  save() {
    console.log('Saving!');
  }
}
