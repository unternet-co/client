import { html, render } from 'lit';
import { DisposableGroup } from '../../base/disposable';
import { attachStyles } from '../../utils/dom';
import '../common/icon';
import { ICON_GLYPHS, ICON_SIZES } from '../common/icon';

export class TabSelectEvent extends Event {
  constructor() {
    super('select');
  }
}

export class TabCloseEvent extends Event {
  constructor() {
    super('close');
  }
}

export class TabHandleElement extends HTMLElement {
  shadow: ShadowRoot;
  isStatic: boolean;
  disposables = new DisposableGroup();

  static observedAttributes = ['static'];

  connectedCallback() {
    this.shadow = this.attachShadow({ mode: 'open' });
    attachStyles(this.shadow, this.styles);

    this.isStatic = typeof this.getAttribute('static') === 'string';
    render(this.template, this.shadow);

    this.disposables.attachListener(this, 'mousedown', () => {
      this.dispatchEvent(new TabSelectEvent());
    });
  }

  disconnectedCallback() {
    this.disposables.dispose();
  }

  handleMouseDown(e: MouseEvent) {
    e.stopPropagation();
    this.dispatchEvent(new TabCloseEvent());
  }

  get template() {
    return html`
      <span class="inner">
        <slot></slot>
      </span>
      ${!this.isStatic
        ? html`<un-icon
            @mousedown=${this.handleMouseDown.bind(this)}
            class="icon-button"
            src=${ICON_GLYPHS.close}
            size=${ICON_SIZES.medium}
          >
          </un-icon>`
        : null}
    `;
  }

  get styles() {
    return /*css*/ `
      :host {
        display: flex;
        position: relative;
        align-items: center;
        -webkit-app-region: no-drag;
        gap: var(--space-3);
        border-left: 1px solid var(--color-border);
        border-right: 1px solid var(--color-border);
        padding: 0 var(--space-6);
        padding-right: var(--space-4);
        margin-right: -1px; /* Remove double-borders */
        font-size: var(--text-sm);
      }

      :host(:hover) {
        background: var(--color-neutral-5);
      }

      :host([active]) {
        background: var(--color-neutral-0);
      }

      :host([static]) {
        padding: 0 var(--space-5);
      }

      .inner {
        display: flex;
        max-width: 180px;
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      un-icon {
        opacity: 0;
        transition: opacity linear 0.1s;
      }

      :host([active]) un-icon, :host(:hover) un-icon {
        opacity: 1;
      }
    `;
  }
}

customElements.define('tab-handle', TabHandleElement);
