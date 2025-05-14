import { html, render } from 'lit';
import { dependencies } from '../../../common/dependencies';

export const shortcutsSectionDef = {
  key: 'shortcuts',
  label: 'Shortcuts',
  render: () => html`<shortcuts-section></shortcuts-section>`,
};

type ShortcutEntry = {
  id: string;
  label: string;
  keys: string;
  description?: string;
};

export class ShortcutsSection extends HTMLElement {
  #shortcutsList: ShortcutEntry[] = [];
  #shortcutService: any;

  connectedCallback() {
    this.#shortcutService = dependencies.resolve<any>('ShortcutService');
    if (this.#shortcutService) {
      // Adapt the output to ShortcutEntry[]
      this.#shortcutsList = this.#shortcutService
        .listShortcuts()
        .map((s: any, i: number) => ({
          id: String(i),
          label: s.keys,
          keys: s.keys,
          description: s.description || '',
        }));
    }
    this.render();
    const focusableElements = this.querySelectorAll('input, textarea, select');
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }

  render() {
    render(
      html`
        <form>
          <h3>Shortcuts</h3>
          <ul>
            ${this.#shortcutsList.map(
              (s) => html`<li><kbd>${s.keys}</kbd> ${s.description}</li>`
            )}
          </ul>
        </form>
      `,
      this
    );
  }
}

customElements.define('shortcuts-section', ShortcutsSection);
