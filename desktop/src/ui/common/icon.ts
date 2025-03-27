import { attachStyles, appendEl } from '../../utils/dom';
import { createElement, icons } from 'lucide';

export const ICON_MAP = {
  'close': 'x',
  'home': 'home',
  'plus': 'plus',
  'toolbox': 'shapes',
  'settings': 'settings-2',
  'check': 'check',
  'dropdown': 'chevron-down',
  'enter': 'corner-down-left',
  'handle': 'grip-horizontal',
  'delete': 'trash',
  'history': 'history'
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
  iconElement: SVGElement | null = null;
  static observedAttributes = ['name', 'size'];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.renderIcon();
    attachStyles(this.shadow, this.styles);
    this.updateIconSize();
  }

  attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    if (name === 'name') {
      this.renderIcon();
    } else if (name === 'size') {
      this.updateIconSize();
    }
  }

  // Standard attributes for all icons
  private readonly iconAttributes = {
    stroke: 'currentColor',
    'stroke-width': '1.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    fill: 'none'
  };

  /**
   * Gets an SVG icon element based on the provided icon name
   * @param iconName The name of the icon to get, defaults to 'help-circle'
   * @returns SVG element for the icon
   */
  private getIcon(iconName: string | null = 'help-circle'): SVGElement {
    const mappedName = ICON_MAP[iconName as keyof typeof ICON_MAP] || iconName;
    
    // Convert kebab-case to PascalCase for Lucide icons
    const pascalCaseName = mappedName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    const iconData = icons[pascalCaseName as keyof typeof icons] || icons.HelpCircle;
    return createElement(iconData, this.iconAttributes) as SVGElement;
  }

  private renderIcon() {
    if (this.iconElement && this.shadow.contains(this.iconElement)) {
      this.shadow.removeChild(this.iconElement);
    }
    
    this.iconElement = this.getIcon(this.getAttribute('name'));
    appendEl(this.shadow, this.iconElement as unknown as HTMLElement);
    this.updateIconSize();
  }

  private updateIconSize() {
    if (!this.iconElement) return;
    
    const size = this.getAttribute('size') as IconSize;
    const sizeValue = this.getSizeValue(size);
    this.style.width = sizeValue;
    this.style.height = sizeValue;
    
    // Also set the SVG size attributes
    this.iconElement.setAttribute('width', sizeValue);
    this.iconElement.setAttribute('height', sizeValue);
  }

  private getSizeValue(size: IconSize | null): string {
    if (!size) return ICON_SIZES.medium;
    return ICON_SIZES[size as keyof typeof ICON_SIZES] || size || ICON_SIZES.medium;
  }

  get styles() {
    return /*css*/ `
      :host {
        display: inline-block;
        color: inherit;
      }

      :host(.icon-button) {
        border-radius: 4px;
      }

      :host(.icon-button:hover) {
        background: var(--color-neutral-10);
      }

      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    `;
  }
}

customElements.define('un-icon', IconElement);
