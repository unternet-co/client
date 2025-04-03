import { attachStyles, appendEl } from '../../utils/dom';
import { createElement, icons } from 'lucide';

export const ICON_MAP = {
  close: 'x',
  home: 'home',
  plus: 'plus',
  toolbox: 'shapes',
  settings: 'settings-2',
  check: 'check',
  dropdown: 'chevron-down',
  enter: 'corner-down-left',
  handle: 'grip-horizontal',
  delete: 'trash',
  history: 'history',
  refresh: 'refresh-cw',
} as const;

export class IconElement extends HTMLElement {
  shadow: ShadowRoot;
  iconElement: SVGElement | null = null;
  static observedAttributes = ['name'];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.renderIcon();
  }

  attributeChangedCallback() {
    this.renderIcon();
  }

  // Standard attributes for all icons
  private readonly iconAttributes = {
    stroke: 'currentColor',
    'stroke-width': '1.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    fill: 'none',
  };

  /**
   * Gets an SVG icon element based on the provided icon name
   * @param iconName The name of the icon to get, defaults to 'help-circle'
   * @returns SVG element for the icon
   */
  private getIcon(iconName: string | null): SVGElement {
    const mappedName =
      ICON_MAP[iconName as keyof typeof ICON_MAP] || 'help-circle';

    // Convert kebab-case to PascalCase for Lucide icons
    const pascalCaseName = mappedName
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    const iconData =
      icons[pascalCaseName as keyof typeof icons] || icons.HelpCircle;
    return createElement(iconData, this.iconAttributes) as SVGElement;
  }

  private renderIcon() {
    if (this.iconElement && this.shadow.contains(this.iconElement)) {
      this.shadow.removeChild(this.iconElement);
    }
    this.iconElement = this.getIcon(this.getAttribute('name'));
    appendEl(this.shadow, this.iconElement as unknown as HTMLElement);
    attachStyles(this.shadow, this.styles);
  }

  get styles() {
    return /*css*/ `
      :host {
        display: inline-block;
        color: inherit;
        width: 16px;
      }

      :host(.icon-button) {
        border-radius: 4px;
      }

      :host(.icon-button:hover) {
        background: var(--color-bg-container);
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
