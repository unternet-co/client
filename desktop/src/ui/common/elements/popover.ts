import { html, css, render } from 'lit';
import { attachStyles } from '../../../common/utils/dom';

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
 *   <button id="popover-button" command="toggle-popover" commandfor="my-popover">Open</button>
 *   <un-popover id="my-popover" anchor="popover-button" position="top"> ... </un-popover>
 */
export class PopoverElement extends HTMLElement {
  static observedAttributes = ['anchor', 'position'];

  #shadow: ShadowRoot;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    attachStyles(this.#shadow, this.styles.toString());
    this.setAttribute('popover', '');
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    if (oldValue === newValue) return;
    this.#render();
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
      throw new Error(msg);
    }
    const anchorNameValue = `--${anchor}`;
    const style = anchorEl.style as CSSStyleDeclaration & {
      anchorName?: string;
    };
    style.anchorName = anchorNameValue;
    (this.style as any).positionAnchor = anchorNameValue;
    this.setAttribute('data-position', position);
  }

  #render() {
    this.#updateAnchorPositioning();
    render(html`<slot></slot>`, this.#shadow);
  }

  get styles() {
    return css`
      /** 
      * Resets
      **/
      :host {
        margin: 0;
        inset: unset;
      }

      /**
      * Default "modal" styles
      **/
      :host {
        border: 1px solid var(--color-border-default);
        max-width: 320px;
        background: var(--color-bg-content);
        border-radius: var(--rounded-lg);
        box-shadow: var(--shadow);
        padding: var(--space-6);
        margin: var(--space-6);
      }

      /** 
      * Positioning logic
      **/
      :host {
        position-try-fallbacks: flip-block, flip-inline;
        position-try: flip-block, flip-inline;
      }
      :host([data-position='top']) {
        position-area: top;
      }
      :host([data-position='right']) {
        position-area: right;
      }
      :host([data-position='bottom']) {
        position-area: bottom;
      }
      :host([data-position='left']) {
        position-area: left;
      }
    `;
  }
}

customElements.define('un-popover', PopoverElement);
