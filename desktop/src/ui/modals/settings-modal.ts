import { html, render } from 'lit';
import './settings-modal.css';
import { ModalElement } from './modal';
import '../common/button';

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
          <un-button
            type="primary"
            text="Save Settings"
            @click=${() => this.saveSettings()}
          ></un-button>
        </div>
      </div>
    `;
  }
}

customElements.define('settings-modal', SettingsModal);
