import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { IconName } from '../icons/icon-registry';
import '../icons/icon';
import { IconSize } from '../icons/icon';

type ButtonVariant = 'auto' | 'compact' | 'ghost' | 'compact-ghost';

@customElement('un-button')
export class Button extends LitElement {
  @property({ type: String, reflect: true })
  accessor variant: ButtonVariant = 'auto';

  @property({ type: String, reflect: true })
  accessor icon: IconName;

  @property({ type: String, reflect: true })
  accessor label: string;

  @property({ type: Boolean, reflect: true })
  accessor toggled: boolean = false;

  @property({ type: String, reflect: true })
  accessor iconSize: IconSize = 'large';

  render() {
    const iconTemplate = this.icon
      ? html`<un-icon .icon=${this.icon} .size=${this.iconSize}></un-icon>`
      : null;

    return html`
      ${iconTemplate}
      <span class="label">${this.label}</span>
    `;
  }

  static styles = css`
    :host {
      --button-padding: var(--space-3);
      -webkit-app-region: no-drag;
      color: var(--color-inset-variant);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--button-padding);
      background: var(--color-inset);
      border: 1px solid var(--color-border);
      border-radius: var(--rounded);
    }

    :host([variant='compact']),
    :host([variant='compact-ghost']) {
      --button-padding: var(--space-1);
    }

    :host([variant='ghost']),
    :host([variant='compact-ghost']) {
      background: transparent;
      border-color: transparent;
    }

    :host([toggled]) {
      background: var(--color-inset) !important;
    }

    :host(:hover) {
      background: var(--color-inset);
    }

    :host([variant='ghost']):hover,
    :host([variant='compact-ghost']):hover {
      background: var(--color-interaction-bg);
    }

    :host un-icon {
      color: var(--color-text-muted);
    }
  `;
}
