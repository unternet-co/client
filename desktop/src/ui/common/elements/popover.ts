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
  #position: PopoverPosition = 'top';
  #anchor?: string;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    attachStyles(this.#shadow, this.styles.toString());
    this.setAttribute('popover', '');
  }

  connectedCallback() {
    if (this.hasAttribute('anchor'))
      this.#anchor = this.getAttribute('anchor') || undefined;
    if (this.hasAttribute('position'))
      this.#position =
        (this.getAttribute('position') as PopoverPosition) || 'top';

    this.#updateAnchorPositioning();

    render(this.template, this.#shadow);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    if (oldValue === newValue) return;
    switch (name) {
      case 'anchor':
        this.anchor = newValue || undefined;
        break;
      case 'position':
        this.position = (newValue as PopoverPosition) || 'top';
        break;
    }
  }

  /**
   * Ensures the anchor element exists and updates popover positioning styles.
   * Throws if the anchor id is defined, but no element with that id is found.
   */
  #updateAnchorPositioning() {
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
    this.setAttribute('data-position', this.position);
  }

  /**
   * The id of the anchor element this popover is positioned against.
   */
  get anchor(): string | undefined {
    return this.#anchor;
  }
  set anchor(val: string | undefined) {
    if (val !== this.#anchor) {
      this.#anchor = val;
      if (val !== undefined) {
        this.setAttribute('anchor', val);
      } else {
        this.removeAttribute('anchor');
      }
      this.#updateAnchorPositioning();
      render(this.template, this.#shadow);
    }
  }

  /**
   * The position of the popover relative to the anchor.
   */
  get position(): PopoverPosition {
    return this.#position;
  }
  set position(val: PopoverPosition) {
    if (val !== this.#position) {
      this.#position = val;
      this.setAttribute('position', val);
      this.#updateAnchorPositioning();
      render(this.template, this.#shadow);
    }
  }

  get template() {
    return html`<slot></slot>`;
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
