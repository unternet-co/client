import { html, render } from 'lit';
import { Modal } from '../modal/modal';
import './settings-page.css';

export class SettingsPage extends HTMLElement {
  private modal: Modal;
  
  connectedCallback() {
    render(this.template, this);
    
    const saveButton = this.querySelector('#save-settings');
    if (saveButton) {
      saveButton.addEventListener('click', () => this.saveSettings());
    }
  }
  
  static open() {
    const settingsElement = document.createElement('settings-page') as SettingsPage;
    settingsElement.modal = Modal.create({
      title: 'Settings'
    });
    settingsElement.modal.contents.appendChild(settingsElement);
    return settingsElement.modal;
  }
  
  saveSettings() {
    this.modal.close();
  }
  
  get template() {
    return html`
      <div class="settings-container">
        <div class="setting-group">
          <!-- TODO: Add settings -->
        </div>
        <div class="setting-group">
          <button id="save-settings">Update settings</button>
        </div>
      </div>
    `;
  }
}

customElements.define('settings-page', SettingsPage);
