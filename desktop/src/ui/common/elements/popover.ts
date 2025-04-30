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
  public anchor?: string;
  public position: 'top' | 'right' | 'bottom' | 'left' = 'bottom';
  static properties = {
    loading: { type: Boolean },
    anchor: { type: String, reflect: true },
    position: { type: String, reflect: true },
  };

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback?.();
    this.setAttribute('popover', '');
    this.updateAnchorPositioning();
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('anchor') || changedProperties.has('position')) {
      this.updateAnchorPositioning();
    }
  }

  updateAnchorPositioning() {
    if (!this.anchor) return;
    const anchorEl = document.getElementById(this.anchor);
    if (!anchorEl) {
      const msg = `[un-popover] Anchor element with id "${this.anchor}" not found.`;
      console.error(msg);
      throw new Error(msg);
    }
    const anchorNameValue = `--${this.anchor}`;
    const style = anchorEl.style as CSSStyleDeclaration & {
      anchorName?: string;
    };
    style.anchorName = anchorNameValue;
    (this.style as any).positionAnchor = anchorNameValue;

    // Set data attribute for CSS to pick up
    this.setAttribute('data-position', this.position || 'bottom');
  }

  render() {
    return html` <slot></slot> `;
  }

  static get styles() {
    return css`
      :host {
        border: 1px solid var(--color-border-default);
        max-width: 320px;
        background: var(--color-bg-content);
        border-radius: var(--rounded-lg);
        box-shadow: var(--shadow);
        padding: var(--space-6);
        margin: var(--space-6);
        position-try-fallbacks: flip-block, flip-inline;
        position-try: flip-block, flip-inline;
      }
      :host:popover-open {
        inset: unset;
      }
      :host([data-position='top']) {
        position-area: top;
      }
      :host([data-position='right']) {
        position-area: right;
      }
      :host([data-position='bottom']) {
        top: anchor(bottom);
        left: max(
          0px,
          min(anchor(center), 100vw - var(--popover-width, 320px))
        );
      }
      :host([data-position='left']) {
        position-area: left;
      }
    `;
  }
}

customElements.define('un-popover', PopoverElement);
