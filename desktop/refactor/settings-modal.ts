import { html, render } from 'lit';
import { until } from 'lit/directives/until';
import './settings-modal.css';
import { ModalElement } from '../src/modals/modal';
import { ollamaService, OllamaModel, OllamaService } from './ollama-service';
import { openaiService, OpenAIModel } from './openai-service';
import { ConfigModel } from '../src/core/config';
import { dependencies } from '../src/common/dependencies';

export class SettingsModal extends ModalElement {
  private configModel = dependencies.resolve<ConfigModel>('ConfigModel');
  private ollamaStatus: Promise<boolean>;
  private ollamaModels: Promise<OllamaModel[]>;
  private openaiApiKey: string = '';
  private openaiModelList: OpenAIModel[] = [];
  private isLoadingOpenAIModels: boolean = false;
  private isRefreshingModels: boolean = false;
  private apiKeyError: string | null = null;
  private openaiConnected: boolean = false;

  connectedCallback() {
    this.refreshOllamaData(false);

    // Only fetch models if there's an existing API key
    if (this.openaiApiKey) {
      // Fetch OpenAI models
      this.fetchOpenAIModels(false);
    }

    render(this.template, this);
  }

  refreshOllamaData(forceRefresh = false) {
    this.isRefreshingModels = true;
    this.ollamaStatus = ollamaService.isRunning();
    this.ollamaModels = this.ollamaStatus.then((isRunning) => {
      if (!isRunning) return [];
      return ollamaService.getModels(forceRefresh).then((models) => {
        // If no model is selected yet, select the first one
        if (models.length > 0 && !ollamaService.getSelectedModel()) {
          ollamaService.setSelectedModel(models[0].name);
        }
        this.isRefreshingModels = false;
        render(this.template, this);
        return models;
      });
    });
  }

  async fetchOpenAIModels(forceRefresh = false) {
    if (!this.openaiApiKey) {
      return;
    }

    this.apiKeyError = null;

    try {
      openaiService.setApiKey(this.openaiApiKey);
      this.isLoadingOpenAIModels = true;
      this.isRefreshingModels = true;
      render(this.template, this);

      // Fetch models
      this.openaiModelList = await openaiService.getModels();

      // Auto-select a model if needed
      if (this.openaiModelList.length > 0) {
        const currentSelected = openaiService.getSelectedModel();
        const modelExists = this.openaiModelList.some(
          (m) => m.id === currentSelected
        );

        if (!modelExists) {
          // Try to find gpt-4o or fallback to first model
          const gpt4o = this.openaiModelList.find((m) => m.id === 'gpt-4o');
          openaiService.setSelectedModel(
            gpt4o?.id || this.openaiModelList[0].id
          );
        }
      }
      this.openaiConnected = true;
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      this.openaiModelList = [];

      if (error instanceof Error && error.message === 'invalid_api_key') {
        this.apiKeyError = 'Invalid API Key';
      }
      this.openaiConnected = false;
    } finally {
      this.isLoadingOpenAIModels = false;
      this.isRefreshingModels = false;
      render(this.template, this);
    }
  }

  handleModelSelect(modelName: string, source: 'ollama' | 'openai') {
    // This would eventually use the ConfigModel to update the model configuration
    // const modelConfig: ModelConfig = {
    //   type: source,
    //   model: modelName,
    //   apiKey: source === 'openai' ? this.openaiApiKey : undefined,
    //   baseUrl: source === 'ollama' ? ollamaService.getBaseUrl() : undefined,
    // };
    // configModel.updateModel(modelConfig);

    // For now, we'll continue using the existing services
    // Clear selection from the other service
    if (source === 'ollama') {
      ollamaService.setSelectedModel(modelName);
      openaiService.setSelectedModel(''); // Clear OpenAI selection
      console.log(`Selected Ollama model: ${modelName}`);
    } else {
      openaiService.setSelectedModel(modelName);
      ollamaService.setSelectedModel(''); // Clear Ollama selection
      console.log(`Selected OpenAI model: ${modelName}`);
    }
    render(this.template, this);
  }

  async handleRefreshOllama() {
    this.refreshOllamaData(true); // Force refresh from API
    render(this.template, this);
  }

  saveSettings() {
    // In the future, this would save all settings to the ConfigModel
    // For example:
    // if (this.selectedModel && this.selectedModelSource) {
    //   const modelConfig: ModelConfig = {
    //     type: this.selectedModelSource,
    //     model: this.selectedModel,
    //     apiKey: this.selectedModelSource === 'openai' ? this.openaiApiKey : undefined,
    //     baseUrl: this.selectedModelSource === 'ollama' ? ollamaService.getBaseUrl() : undefined,
    //   };
    //   configModel.updateModel(modelConfig);
    // }

    this.close();
  }

  get ollamaStatusTemplate() {
    return html`
      <div class="model-source">
        <h4>Ollama</h4>
        <div class="model-source-setting status-container">
          ${until(
            this.ollamaStatus.then(
              (isRunning) => html`
                <div
                  class="status ${isRunning
                    ? 'status-online'
                    : 'status-offline'}"
                >
                  <span class="status-indicator"></span>
                  ${isRunning
                    ? 'Connected'
                    : html`Ollama not found on port 11434`}
                </div>
              `
            ),
            html`<div class="status status-checking">
              <span class="status-indicator"></span>
              Checking...
            </div>`
          )}
          <button
            @click=${() => this.handleRefreshOllama()}
            class="refresh-button"
          >
            <un-icon name="refresh"></un-icon>
          </button>
        </div>
      </div>
    `;
  }

  get openaiSettingsTemplate() {
    return html`
      <div class="model-source">
        <h4>OpenAI</h4>
        <div class="model-source-setting status-container">
          ${this.openaiConnected
            ? html`<div class="status status-online">
                <span class="status-indicator"></span>
                Connected
              </div>`
            : html`<div class="status status-offline">
                <span class="status-indicator"></span>
                Disconnected
              </div>`}
        </div>
        <div class="model-source-setting api-key-container">
          <label for="api-key">API Key</label>
          <input
            type="password"
            placeholder="Paste your OpenAI API key"
            .value=${this.openaiApiKey || ''}
            @blur=${() => this.fetchOpenAIModels()}
            @paste=${(e: ClipboardEvent) => {
              const pastedText = e.clipboardData?.getData('text') || '';
              if (pastedText) {
                this.openaiApiKey = pastedText.trim();
                setTimeout(() => this.fetchOpenAIModels(), 0);
              }
            }}
            class="api-key-input ${this.apiKeyError ? 'error' : ''}"
          />
          ${this.apiKeyError
            ? html`<div class="error-message">${this.apiKeyError}</div>`
            : ''}
        </div>
      </div>
    `;
  }

  isModelSelected(modelId: string, source: 'ollama' | 'openai'): boolean {
    return source === 'ollama'
      ? ollamaService.isModelSelected(modelId)
      : openaiService.isModelSelected(modelId);
  }

  renderModelRow(
    name: string,
    source: 'ollama' | 'openai',
    details: string,
    isSelected: boolean
  ) {
    return html`
      <li
        class=${isSelected ? 'selected-model' : ''}
        @click=${() => this.handleModelSelect(name, source)}
      >
        <div class="model-status">
          ${isSelected ? html`<span class="selected-indicator">✓</span>` : ''}
        </div>
        <div class="model-info">
          <div class="name">${name}</div>
          <div class="details">${details}</div>
          <div class="source">${source === 'openai' ? 'OpenAI' : 'Ollama'}</div>
        </div>
      </li>
    `;
  }

  renderOpenAIModelRows() {
    if (this.openaiModelList.length === 0) {
      return html``;
    }

    return this.openaiModelList.map((model) => {
      const isSelected = this.isModelSelected(model.id, 'openai');
      return this.renderModelRow(model.id, 'openai', '', isSelected);
    });
  }

  renderOllamaModelRows(models: OllamaModel[]) {
    if (!models || models.length === 0) {
      return html``;
    }

    return models.map((model) => {
      const isSelected = this.isModelSelected(model.name, 'ollama');
      const paramSize = model.details.parameter_size || 'Unknown';
      const diskSize = OllamaService.formatModelSize(model.size);
      const details = `${paramSize} / ${diskSize}`;

      return this.renderModelRow(model.name, 'ollama', details, isSelected);
    });
  }

  renderAllModels() {
    return html`
      <ul class="available-models">
        ${this.renderOpenAIModelRows()}
        ${until(
          this.ollamaModels.then((models) =>
            this.renderOllamaModelRows(models)
          ),
          html`<li>Loading Ollama models...</li>`
        )}
      </ul>
    `;
  }

  get modelsTemplate() {
    const showLoadingIndicator =
      this.isLoadingOpenAIModels && !this.openaiModelList.length;

    return html`
      <h3>Available Models</h3>
      ${this.isRefreshingModels
        ? html`<p class="refreshing-indicator">Refreshing models...</p>`
        : ''}
      ${showLoadingIndicator
        ? html`<p>Loading models...</p>`
        : this.renderAllModels()}
    `;
  }

  get template() {
    return html`
      <div class="settings-container">
        <div class="setting-group">
          <h3>Global Hint</h3>
          <p>Customize how the models respond to your commands.</p>
          <textarea></textarea>
        </div>
        <div class="setting-group">
          <h3>Model Sources</h3>
          <div class="model-sources">
            ${this.openaiSettingsTemplate} ${this.ollamaStatusTemplate}
          </div>
        </div>
        <div class="setting-group">${this.modelsTemplate}</div>
      </div>
    `;
  }
}

customElements.define('settings-modal', SettingsModal);
