import { LitElement, html, css } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import { createElement, icons } from 'lucide';

export const ICON = {
  close: 'x',
  home: 'home',
  plus: 'plus',
  bug: 'bug',
  toolbox: 'shapes',
  settings: 'settings-2',
  check: 'check',
  dropdown: 'chevrons-up-down',
  enter: 'corner-down-left',
  handle: 'grip-horizontal',
  delete: 'trash',
  history: 'history',
  refresh: 'refresh-cw',
  error: 'alert-triangle',
  loading: 'loader-circle',
  external: 'external-link',
  download: 'download',
  left: 'arrow-left',
  right: 'arrow-right',
  up: 'arrow-up',
  down: 'arrow-down',
  search: 'search',
  upload: 'upload',
  attachment: 'paperclip',
} as const;

export type IconSize = 'small' | 'medium' | 'large';
const sizeMap = {
  small: '12',
  medium: '14',
  large: '18',
};

export class IconElement extends LitElement {
  name: string | null = null;
  size: IconSize = 'medium';
  spin: string | null = null;

  iconContainer = createRef<HTMLDivElement>();

  static get properties() {
    return {
      name: { type: String },
      size: { type: String },
      spin: { type: String, reflect: true },
    };
  }

  constructor() {
    super();
  }

  private getIconAttributes() {
    return {
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      width: sizeMap[this.size || 'medium'],
      height: sizeMap[this.size || 'medium'],
      fill: 'none',
    };
  }

  /**
   * Gets the Lucide icon based on the provided icon name
   * @param iconName The name of the icon to get, defaults to 'help-circle'
   * @returns SVG element for the icon
   */
  private getIcon(iconName: string | null): SVGElement {
    const mappedName = ICON[iconName as keyof typeof ICON] || 'help-circle';

    // Convert kebab-case to PascalCase for Lucide icons
    const pascalCaseName = mappedName
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    const iconData =
      icons[pascalCaseName as keyof typeof icons] || icons.HelpCircle;
    return createElement(iconData, this.getIconAttributes()) as SVGElement;
  }

  render() {
    const spinClass = this.spin !== null ? 'spin' : '';
    const spinStyle =
      this.spin && this.spin !== '' ? `--spin-duration: ${this.spin};` : '';

    return html`
      <div class="${spinClass}" style="${spinStyle}">
        <div class="icon-container" ${ref(this.iconContainer)}></div>
      </div>
    `;
  }

  updated() {
    if (this.iconContainer.value) {
      this.iconContainer.value.innerHTML = '';
      const iconElement = this.getIcon(this.name);
      this.iconContainer.value.appendChild(iconElement);
    }
  }

  static get styles() {
    return css`
      :host {
        display: inline-block;
        color: inherit;
      }

      .icon-container svg {
        display: block;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .spin {
        --spin-duration: 2s;
        animation: spin var(--spin-duration) linear infinite;
        transform-origin: center;
      }
    `;
  }
}

customElements.define('un-icon', IconElement);
