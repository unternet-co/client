import { html, render } from 'lit';
import './settings-modal.css';
import { ModalElement } from './modal';

export class SettingsModal extends ModalElement {
  connectedCallback() {
    render(this.template, this);
  }

  saveSettings() {
    this.close();
  }

  get template() {
    return html`
      <div class="settings-container">
        <div class="setting-group">
          <!-- TODO: Add settings -->
        </div>
        <div class="setting-group">
          <button id="save-settings" @click=${() => this.saveSettings()}>
            Update settings
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('settings-modal', SettingsModal);
