import { html, render } from 'lit';
import './popover.css';

export type PopoverPosition = 'top' | 'right' | 'bottom' | 'left';

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
    this.classList.add('un-popover');
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    if (oldValue === newValue) return;
    setTimeout(() => this.render(), 0);
  }

  /**
   * Ensures the anchor element exists and updates popover positioning styles.
   * Throws if the anchor id is defined, but no element with that id is found.
   */
  #updateAnchorPositioning() {
    const anchor = this.getAttribute('anchor');
    const position = this.getAttribute('position');

    if (!anchor) return;
    const anchorEl = document.getElementById(anchor);
    if (!anchorEl) {
      const msg = `[un-popover] Anchor element with id "${anchor}" not found.`;
      console.error(msg);
      this.removeAttribute('data-position'); // Remove positioning if anchor is missing
      return;
    }

    const anchorNameValue = `--${anchor}`;
    const style = anchorEl.style as CSSStyleDeclaration & {
      anchorName?: string;
    };
    style.anchorName = anchorNameValue;
    (this.style as any).positionAnchor = anchorNameValue;
    this.setAttribute('data-position', position);
  }

  render() {
    this.#updateAnchorPositioning();
    render(this.template, this);
  }

  get template() {
    return html`<section class="content"><slot></slot></section>`;
  }
}

customElements.define('un-popover', PopoverElement);
