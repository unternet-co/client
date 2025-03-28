import { appendEl, attachStyles, createEl } from '../../utils/dom';

export const ICON_GLYPHS = {
  close: '/icons/close.svg',
  home: '/icons/home.svg',
  settings: '/icons/settings.svg',
  delete: '/icons/delete.svg',
} as const;

export const ICON_SIZES = {
  small: '12px',
  medium: '16px',
  large: '24px',
  xlarge: '32px',
} as const;

type IconSize = keyof typeof ICON_SIZES | string;

export class IconElement extends HTMLElement {
  shadow: ShadowRoot;
  imgElement: HTMLImageElement;
  static observedAttributes = ['src', 'size'];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.imgElement = appendEl(
      this.shadow,
      createEl('img', { src: this.getAttribute('src') || '' })
    ) as HTMLImageElement;

    attachStyles(this.shadow, this.styles);
    this.updateImageSize();
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    if (!this.imgElement) return;
    if (name === 'src') {
      this.imgElement.src = newValue;
    } else if (name === 'size') {
      this.updateImageSize();
    }
  }

  private updateImageSize() {
    const size = this.getAttribute('size') as IconSize;
    const sizeValue = this.getSizeValue(size);
    this.style.width = sizeValue;
    this.style.height = sizeValue;
  }

  private getSizeValue(size: IconSize | null): string {
    if (!size) return ICON_SIZES.medium;
    return (
      ICON_SIZES[size as keyof typeof ICON_SIZES] || size || ICON_SIZES.medium
    );
  }

  get styles() {
    return /*css*/ `
      :host {
        display: inline-block;
      }

      :host(.icon-button) {
        border-radius: 4px;
      }

      :host(.icon-button:hover) {
        background: var(--color-neutral-10);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    `;
  }
}

customElements.define('un-icon', IconElement);
