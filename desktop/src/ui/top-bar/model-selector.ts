import { html, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { ConfigService } from '../../config/config-service';
import { AIModelProviderNames } from '../../ai/model-service';
import { ModalService } from '../common/modals/modal-service';

export class ModelSelector extends HTMLElement {
  configService = dependencies.resolve<ConfigService>('ConfigService');
  modalService = dependencies.resolve<ModalService>('ModalService');
  #selectedProvider: string = '';
  #selectedModel: string = '';

  connectedCallback() {
    this.#syncWithConfig();
    this.configService.subscribe((notification) => {
      if (notification?.type === 'model') {
        this.#syncWithConfig();
      }
    });
    this.render();
  }

  #syncWithConfig() {
    const config = this.configService.get();
    this.#selectedProvider = config.ai.primaryModel.provider;
    this.#selectedModel = config.ai.primaryModel.name;
    this.render();
  }

  render() {
    const providerLabel =
      AIModelProviderNames[this.#selectedProvider] || this.#selectedProvider;
    const modelLabel = this.#selectedModel;
    const buttonLabel = `${providerLabel ? providerLabel : ''}${
      providerLabel && modelLabel ? '/' : ''
    }${modelLabel ? modelLabel : 'No model'}`;
    render(
      html`
        <un-button
          variant="ghost"
          class="settings-button"
          label=${buttonLabel}
          @click=${() =>
            this.modalService.open('settings', { section: 'global' })}
        >
        </un-button>
      `,
      this
    );
  }
}

customElements.define('model-selector', ModelSelector);
