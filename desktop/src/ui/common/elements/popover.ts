import { LitElement, html, css } from 'lit';

/**
 * <un-popover>
 * A generic, composable popover using the native Popover API.
 *
 * Usage:
 *   <button popovertarget="my-popover">Open</button>
 *   <un-popover id="my-popover"> ... </un-popover>
 */
export class PopoverElement extends LitElement {
  static properties = {
    loading: { type: Boolean },
  };

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback?.();
    this.setAttribute('popover', '');
  }

  render() {
    return html` <slot></slot> `;
  }

  static get styles() {
    return css`
      :host {
        border: 1px solid var(--color-border-default, #e0e0e0);
        min-width: 320px;
        max-width: 95vw;
        background: var(--color-bg-content, #fff);
        border-radius: var(--rounded-lg, 12px);
        box-shadow: var(--shadow, 0 4px 32px rgba(0, 0, 0, 0.14));
        padding: 20px 24px;
        z-index: 1000;
        outline: none;
        font: inherit;
        transition: box-shadow 0.13s;
      }
    `;
  }
}

customElements.define('un-popover', PopoverElement);
