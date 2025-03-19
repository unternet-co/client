import { DisposableGroup } from '../../base/disposable';
import { attachStyles } from '../../utils/dom';
import '../common/icon';
import { ICON_GLYPHS, ICON_SIZES } from '../common/icon';

export class TabSelectEvent extends Event {
  constructor() {
    super('select');
  }
}

export class TabHandleElement extends HTMLElement {
  shadow: ShadowRoot;
  active: boolean;
  titleElement: HTMLElement;
  disposables = new DisposableGroup();

  static observedAttributes = ['active'];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });

    attachStyles(this.shadow, this.styles);
    this.shadow.innerHTML = this.template;
    this.titleElement = this.shadow.querySelector('.title')!;

    this.disposables.attachListener(this, 'mousedown', () => {
      this.dispatchEvent(new TabSelectEvent());
    });
  }

  get template() {
    return /*html*/ `
      <span class="title">
        <slot></slot>
      </span>        
      <un-icon src=${ICON_GLYPHS.close} size=${ICON_SIZES.medium}></un-icon>
    `;
  }

  get styles() {
    return /*css*/ `
      :host {
        display: flex;
        position: relative;
        align-items: center;
        -webkit-app-region: no-drag;
        gap: var(--space-2);
        border-left: 1px solid var(--color-border);
        border-right: 1px solid var(--color-border);
        padding: 0 var(--space-6);
        width: fit-content;
        margin-right: -1px; /* Remove double-borders */
        font-size: var(--text-sm);
      }

      :host(:hover) {
        background: var(--color-neutral-5);
      }

      :host([active]) {
        background: var(--color-page);
      }

      .title {
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
  }
}

customElements.define('tab-handle', TabHandleElement);
