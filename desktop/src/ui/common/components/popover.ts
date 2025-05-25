import { html, render } from 'lit';
import './popover.css';

export type PopoverPosition = 'top' | 'right' | 'bottom' | 'left';

type CSSDeclarationWithAnchor = CSSStyleDeclaration & {
  anchorName?: string;
  positionAnchor?: string;
};

/**
 * A generic, composable popover custom element using the native Popover API.
 *
 * @element un-popover
 * @attr {string} anchor - The id of the anchor element this popover is positioned against.
 * @attr {PopoverPosition} position - The position of the popover relative to the anchor (top, right, bottom, left).
 * @slot - Default slot for popover content.
 *
 * Usage example:
 *   <button id="popover-button" popovertarget="my-popover">Open</button>
 *   <un-popover id="my-popover" anchor="popover-button" position="top"> ... </un-popover>
 */
export class PopoverElement extends HTMLElement {
  static observedAttributes = ['anchor', 'position'];

  constructor() {
    super();
    this.setAttribute('popover', '');
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    if (name === 'position') this.updatePosition(newValue);
    if (name === 'anchor') this.updateAnchor(newValue);
  }

  updatePosition(position: string) {
    this.setAttribute('data-position', position ?? 'top');
    this.render();
  }

  updateAnchor(anchor: string) {
    if (!anchor) return;
    const anchorEl = document.getElementById(anchor);

    if (!anchorEl) {
      const msg = `[un-popover] Anchor element with id "${anchor}" not found.`;
      console.error(msg);
      this.removeAttribute('data-position');
      return;
    }

    const anchorNameValue = `--${anchor}`;

    (anchorEl.style as CSSDeclarationWithAnchor).anchorName = anchorNameValue;
    (this.style as CSSDeclarationWithAnchor).positionAnchor = anchorNameValue;

    this.render();
  }

  render() {
    const template = html`<section class="content"><slot></slot></section>`;
    render(template, this);
  }
}

customElements.define('un-popover', PopoverElement);
