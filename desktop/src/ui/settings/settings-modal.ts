import { html, render } from 'lit';
import { ModalElement } from '../common/modals/modal-element';
import { View } from '../common/view';
import { SettingsSection } from './settings-section';
import { ModelSettingsSection } from './general/model-settings';

export class SettingsModal extends View {
  element = document.createElement('div');

  constructor(private sections: Array<SettingsSection>) {
    super();

    for (const section of this.sections) {
      this.element.appendChild(section.element);
    }
  }
}

// TODO: Refactor modals, so we can just use SettingsModal
export class SettingsModalElement extends ModalElement {
  settingsModal: SettingsModal;
  constructor() {
    super({ title: 'Settings', size: 'full' });
  }
  connectedCallback() {
    const sections = [new ModelSettingsSection()];
    this.settingsModal = new SettingsModal(sections);
    const template = html`${this.settingsModal.element}`;
    render(template, this);
  }
}
customElements.define('settings-modal', SettingsModalElement);
