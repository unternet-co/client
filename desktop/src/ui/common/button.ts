import { html, render } from 'lit';
import './icons/icon';
import './button.css';

const BUTTON_VARIANTS = [
  'primary',
  'secondary',
  'negative',
  'outline',
  'link',
  'ghost',
] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

const BUTTON_SIZES = ['small', 'medium', 'large'] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

const ICON_POSITIONS = ['start', 'end'] as const;
export type IconPosition = (typeof ICON_POSITIONS)[number];

const ALLOWED_TYPES = ['submit', 'reset', 'button'] as const;
const ATTRS_TO_UPDATE = new Set([
  'disabled',
  'type',
  'variant',
  'size',
  'icon',
  'icon-position',
  'loading',
  'title',
  'popovertarget',
  'popovertargetaction',
]);

export class UnButton extends HTMLElement {
  #btn!: HTMLButtonElement;
  static get observedAttributes() {
    return Array.from(ATTRS_TO_UPDATE);
  }

  connectedCallback() {
    if (!this.#btn) this.#createNativeButton();
    for (const a of this.attributes) this.#syncAttr(a.name);
    this.#updateAria();
    this.#updateClassNames();
    this.#render();
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    _new: string | null
  ) {
    if (!this.#btn) return;
    this.#syncAttr(name);
    if (ATTRS_TO_UPDATE.has(name)) {
      this.#updateClassNames();
      this.#render();
    }
    if (name === 'disabled' || name === 'loading') this.#updateAria();
  }

  #updateAria() {
    this.#btn.setAttribute(
      'aria-disabled',
      String(this.hasAttribute('disabled'))
    );
    this.#btn.setAttribute('aria-busy', String(this.hasAttribute('loading')));
  }

  #createNativeButton() {
    this.#btn = document.createElement('button');
    this.#btn.setAttribute('type', 'button');
    this.appendChild(this.#btn);
  }

  #syncAttr(name: string) {
    const v = this.getAttribute(name);
    switch (name) {
      case 'type': {
        this.#btn.type =
          v && (ALLOWED_TYPES as readonly string[]).includes(v)
            ? (v as (typeof ALLOWED_TYPES)[number])
            : 'button';
        break;
      }
      case 'disabled':
        this.#btn.disabled = v !== null;
        break;
      case 'popovertarget':
      case 'popovertargetaction':
        v === null
          ? this.#btn.removeAttribute(name)
          : this.#btn.setAttribute(name, v);
        break;
      default:
      /* no direct mapping needed */
    }
  }

  #updateClassNames() {
    this.#btn.classList.remove(...BUTTON_VARIANTS, ...BUTTON_SIZES, 'loading');
    const classes = [];
    const variant = this.getAttribute('variant');
    if (BUTTON_VARIANTS.includes(variant as ButtonVariant))
      classes.push(variant!);
    const size = this.getAttribute('size');
    if (BUTTON_SIZES.includes(size as ButtonSize)) classes.push(size!);
    if (this.hasAttribute('loading')) classes.push('loading');
    if (classes.length) this.#btn.classList.add(...classes);
  }

  #renderIcon(position: IconPosition, name: string | null, size: string) {
    return html`<un-icon
      class="un-button-icon icon-${position} keep"
      name="${name}"
      size="${size}"
      ?spin=${name === 'loading'}
    ></un-icon>`;
  }

  // Only remove icon/label nodes that we know we created, not all children.
  // Remove text nodes (label from light DOM), or elements with .keep (previously rendered label/icon)
  #shouldRemoveNode(node: Node): boolean {
    return (
      node !== this.#btn &&
      (node.nodeType === Node.TEXT_NODE ||
        (node instanceof HTMLElement && node.classList.contains('keep')))
    );
  }

  #render() {
    const label = this.textContent?.trim() ?? '';

    const nodesToRemove = Array.from(this.childNodes).filter((node) =>
      this.#shouldRemoveNode(node)
    );
    nodesToRemove.forEach((node) => this.removeChild(node));

    const loading = this.hasAttribute('loading');
    const iconName = loading ? 'loading' : this.getAttribute('icon');
    const iconPosition = this.getAttribute('icon-position') ?? 'start';
    const size = this.getAttribute('size') ?? 'medium';

    render(
      html`
        ${iconPosition === 'start' && iconName
          ? this.#renderIcon('start', iconName, size)
          : null}
        ${label
          ? html`<span class="un-button-label keep">${label}</span>`
          : null}
        ${iconPosition === 'end' && iconName
          ? this.#renderIcon('end', iconName, size)
          : null}
      `,
      this.#btn
    );
  }
}

customElements.define('un-button', UnButton);
