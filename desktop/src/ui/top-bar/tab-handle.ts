import { css, html, render } from "lit";
import { DisposableGroup } from "../../base/disposable";
import { attachStyles } from "../../utils/dom";
import "../common/icon";

export class TabSelectEvent extends Event {
  constructor() {
    super("select");
  }
}

export class TabCloseEvent extends Event {
  constructor() {
    super("close");
  }
}

export class TabRenameEvent extends CustomEvent<{ value: string }> {
  constructor(value: string) {
    super("rename", {
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

  static observedAttributes = ["static", "active"];

  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    attachStyles(this.shadow, this.styles.toString());

    this.isStatic = typeof this.getAttribute("static") === "string";
    render(this.template, this.shadow);

    this.disposables.attachListener(this, "click", (e: MouseEvent) => {
      const isSelected = this.hasAttribute("active");
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
    const span = this.shadow.querySelector("[contenteditable]") as HTMLElement;
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
      const newText = span.textContent?.trim() || "";
      if (newText) {
        this.dispatchEvent(new TabRenameEvent(newText));
      }
      this.finishEditing();
    } catch (err) {
      console.error("Error in blur handler:", err);
      this.finishEditing();
    }
  }

  handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      const span = e.target as HTMLElement;
      const newText = span.textContent?.trim() || "";
      if (newText) {
        this.dispatchEvent(new TabRenameEvent(newText));
      }
      this.finishEditing();
      e.preventDefault();
    } else if (e.key === "Escape") {
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
              >${this.innerText || ""}</span
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
    `;
  }
}

customElements.define("tab-handle", TabHandleElement);
