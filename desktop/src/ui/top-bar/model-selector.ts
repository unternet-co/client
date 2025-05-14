import { html, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { ConfigModel } from '../../models/config-model';
import { AIModelProviderNames } from '../../ai/ai-models';
import { ModalService } from '../../modals/modal-service';

export class ModelSelector extends HTMLElement {
  configModel = dependencies.resolve<ConfigModel>('ConfigModel');
  modalService = dependencies.resolve<ModalService>('ModalService');
  #selectedProvider: string = '';
  #selectedModel: string = '';

  connectedCallback() {
    this.#syncWithConfig();
    this.configModel.subscribe(() => this.#syncWithConfig());
    this.render();
  }

  #syncWithConfig() {
    const config = this.configModel.get();
    this.#selectedProvider = config.ai.primaryModel.provider;
    this.#selectedModel = config.ai.primaryModel.name;
    this.render();
  }

  render() {
    const providerLabel =
      AIModelProviderNames[this.#selectedProvider] || this.#selectedProvider;
    const modelLabel = this.#selectedModel;
    render(
      html`
        <un-button
          variant="ghost"
          class="settings-button"
          @click=${() =>
            this.modalService.open('settings', { section: 'global' })}
        >
          ${providerLabel ? html`${providerLabel}` : ''}
          ${providerLabel && modelLabel ? html`/` : ''}
          ${modelLabel ? html`${modelLabel}` : html`No model`}
        </un-button>
      `,
      this
    );
  }
}

customElements.define('model-selector', ModelSelector);
