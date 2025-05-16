import { html, render } from 'lit';
import { ModalElement, ModalOptions } from '../../../modals/modal-element';

import './index.css';

import { appletsSectionDef } from './applets-section';
import { workspaceSectionDef } from './workspace-section';
import { globalSectionDef } from './global-section';
import { shortcutsSectionDef } from './shortcuts-section';

const settingsSections = [
  workspaceSectionDef,
  globalSectionDef,
  shortcutsSectionDef,
  appletsSectionDef,
] as const;

type SectionKey = (typeof settingsSections)[number]['key'];

/**
 * SettingsModal: A modular, extensible modal for application settings.
 * Sections declare their own metadata and render logic.
 * The modal coordinates section switching and focus, with minimal internal state.
 */
export class SettingsModal extends ModalElement {
  #section: SectionKey = 'workspace';
  static #sectionMap = new Map(settingsSections.map((s) => [s.key, s]));

  constructor() {
    super({ title: 'Settings', size: 'full-height' } as ModalOptions);
  }

  connectedCallback() {
    this.addEventListener('modal-open', this.#onModalOpen);
    this.render();
  }

  disconnectedCallback() {
    this.removeEventListener('modal-open', this.#onModalOpen);
  }

  #onModalOpen = (event: CustomEvent) => {
    const options = event.detail?.options;
    if (
      options &&
      typeof options.section === 'string' &&
      SettingsModal.#sectionMap.has(options.section)
    ) {
      this.#section = options.section;
      this.render();
    }
  };

  #handleMenuClick = (section: SectionKey) => {
    this.#section = section;
    this.render();
  };

  get template() {
    const section = SettingsModal.#sectionMap.get(this.#section);
    return html`
      <div class="settings-modal-layout">
        <nav class="settings-menu">
          ${settingsSections.map(
            (section) => html`
              <un-button
                variant="ghost"
                class=${this.#section === section.key ? 'active' : ''}
                @click=${() => this.#handleMenuClick(section.key)}
                >${section.label}</un-button
              >
            `
          )}
        </nav>
        <div class="settings-content">
          <div id="section-container">${section?.render() ?? null}</div>
        </div>
      </div>
    `;
  }

  render() {
    render(this.template, this);
  }
}

customElements.define('settings-modal', SettingsModal);
