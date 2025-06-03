import { css, html, render } from 'lit';
import './button.css';
import { attachStyles } from '../../../common/utils';

class Button extends HTMLElement {
  static observedAttributes = ['icon', 'label'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    attachStyles(this.shadowRoot, this.styles.cssText);
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const label = this.getAttribute('label');
    const icon = this.getAttribute('icon');

    const iconTemplate = html`<un-icon name=${icon}></un-icon>`;

    const template = html`
      ${iconTemplate}
      <span class="label">${label}</span>
    `;

    render(template, this.shadowRoot);
  }

  get styles() {
    return css`
      :host {
        --button-padding: var(--space-3);
        -webkit-app-region: no-drag;
        color: var(--color-interaction-body);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--button-padding);
        background: var(--color-interaction-bg);
        border: var(--color-border);
        border-radius: var(--rounded);
      }

      :host[variant='compact'],
      :host[variant='compact-ghost'] {
        --button-padding: var(--space-1);
      }

      :host[variant='ghost'],
      :host[variant='compact-ghost'] {
        background: transparent;
      }

      :host:hover {
        background: var(--color-interaction-hover);
      }

      :host[variant='ghost']:hover,
      :host[variant='compact-ghost']:hover {
        background: var(--color-interaction-bg);
      }
    `;
  }
}

customElements.define('un-button', Button);
