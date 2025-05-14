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
        .filter((s: any) => !!s.description)
        .map((s: any, i: number) => ({
          id: String(i),
          label: s.keys,
          keys: s.keys,
          description: s.description,
        }));
    }
    this.render();
    const focusableElements = this.querySelectorAll('input, textarea, select');
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }

  /**
   * Prettify a shortcut string for macOS (e.g. 'Meta+Shift+T' -> '⌘⇧T')
   */
  prettifyShortcut(keys: string): string {
    if (!keys) return '';
    // macOS symbols
    const macMap: Record<string, string> = {
      META: '⌘',
      CMD: '⌘',
      COMMAND: '⌘',
      CTRL: '⌃',
      CONTROL: '⌃',
      SHIFT: '⇧',
      ALT: '⌥',
      OPTION: '⌥',
      ESC: '⎋',
      ESCAPE: '⎋',
      ENTER: '⏎',
      RETURN: '⏎',
      TAB: '⇥',
      BACKSPACE: '⌫',
      DELETE: '⌦',
      UP: '↑',
      DOWN: '↓',
      LEFT: '←',
      RIGHT: '→',
      SPACE: '␣',
    };
    return keys
      .split('+')
      .map((k) => {
        const upper = k.trim().toUpperCase();
        return macMap[upper] || k.trim();
      })
      .join('');
  }

  render() {
    render(
      html`
        <form>
          <h3>Shortcuts</h3>
          <table class="shortcuts-table">
            <tbody>
              ${this.#shortcutsList.map(
                (s) => html`
                  <tr>
                    <td>
                      ${this.prettifyShortcut(s.keys)
                        .split('')
                        .map((char) => html`<kbd>${char}</kbd>`)}
                    </td>
                    <td>${s.description}</td>
                  </tr>
                `
              )}
            </tbody>
          </table>
        </form>
      `,
      this
    );
  }
}

customElements.define('shortcuts-section', ShortcutsSection);
