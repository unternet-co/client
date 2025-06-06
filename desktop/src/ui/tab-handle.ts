import { css, html, render } from 'lit';
import { DisposableGroup } from '../common/disposable';
import { attachStyles } from '../common/utils/dom';
import './common/icons/icon';

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

export class TabRenameEvent extends CustomEvent<{ value: string }> {
  constructor(value: string) {
    super('rename', {
      detail: { value },
      bubbles: true,
      composed: true,
    });
  }
}

export class TabHandleElement extends HTMLElement {
  shadow: ShadowRoot;
  isStatic: boolean;
  isEditing: boolean = false;
  disposables = new DisposableGroup();

  static observedAttributes = ['static', 'active'];

  connectedCallback() {
    this.shadow = this.attachShadow({ mode: 'open' });
    attachStyles(this.shadow, this.styles.toString());

    this.isStatic = typeof this.getAttribute('static') === 'string';
    render(this.template, this.shadow);

    this.disposables.attachListener(this, 'click', (e: MouseEvent) => {
      const isSelected = this.hasAttribute('active');
      if (isSelected && !this.isStatic && !this.isEditing) {
        e.stopPropagation();
        this.editName();
      } else {
        this.dispatchEvent(new TabSelectEvent());
      }
    });
  }

  editName() {
    this.isEditing = true;
    render(this.template, this.shadow);
    const span = this.shadow.querySelector('[contenteditable]') as HTMLElement;
    if (span) {
      span.focus();
      // Create a range to select all text
      const range = document.createRange();
      range.selectNodeContents(span);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  disconnectedCallback() {
    this.disposables.dispose();
  }

  handleMouseDown(e: MouseEvent) {
    e.stopPropagation();
    this.dispatchEvent(new TabCloseEvent());
  }

  handleBlur(e: FocusEvent) {
    try {
      const span = e.target as HTMLElement;
      const newText = span.textContent?.trim() || '';
      if (newText) {
        this.dispatchEvent(new TabRenameEvent(newText));
      }
      this.finishEditing();
    } catch (err) {
      console.error('Error in blur handler:', err);
      this.finishEditing();
    }
  }

  handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const span = e.target as HTMLElement;
      const newText = span.textContent?.trim() || '';
      if (newText) {
        this.dispatchEvent(new TabRenameEvent(newText));
      }
      this.finishEditing();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this.finishEditing();
      e.preventDefault();
    }
  }

  finishEditing() {
    this.isEditing = false;
    render(this.template, this.shadow);
  }

  get template() {
    return html`
      <span class="inner">
        ${this.isEditing
          ? html`<span
              contenteditable="true"
              @blur=${this.handleBlur.bind(this)}
              @keydown=${this.handleKeyDown.bind(this)}
              @click=${(e: MouseEvent) => e.stopPropagation()}
              >${this.innerText || ''}</span
            >`
          : html`<slot></slot>`}
      </span>
      ${!this.isStatic
        ? html`<un-icon
            @mousedown=${this.handleMouseDown.bind(this)}
            class="icon-button"
            name="close"
          >
          </un-icon>`
        : null}
    `;
  }

  get styles() {
    return css`
      :host {
        display: flex;
        position: relative;
        align-items: center;
        -webkit-app-region: no-drag;
        gap: var(--space-3);
        border-right: 1px solid var(--color-border-default);
        padding: 0 var(--space-6);
        padding-right: var(--space-4);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
      }

      :host(:hover) {
        background: var(--color-bg-container);
        color: var(--color-text-default);
      }

      :host([active]) {
        background: var(--color-bg-page);
      }

      :host([active]:not([static])) .inner {
        cursor: text;
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

      .inner [contenteditable] {
        display: inline-block;
        min-width: 4ch;
        border: none;
        background: transparent;
        outline: none;
        font-size: inherit;
        font-family: inherit;
        color: inherit;
        white-space: nowrap;
        overflow: visible;
        padding: 0;
      }

      un-icon {
        opacity: 0;
        transition: opacity linear 0.1s;
      }

      :host([active]) un-icon,
      :host(:hover) un-icon {
        opacity: 1;
      }

      un-icon:hover {
        background: var(--color-bg-page);
      }
    `;
  }
}

customElements.define('tab-handle', TabHandleElement);
