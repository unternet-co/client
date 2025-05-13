import { html, css, render } from 'lit';
import { createElement } from 'lucide';
import { getIcon } from './icon-registry';
import { attachStyles } from '../../../common/utils/dom';

export type IconSize = 'small' | 'medium' | 'large';
const sizeMap = {
  small: '12',
  medium: '14',
  large: '18',
};

export class IconElement extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'size', 'spin'];
  }

  #name: string | null = null;
  #size: IconSize = 'medium';
  #spin: string | null = null;
  #shadow: ShadowRoot;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  attributeChangedCallback(
    attr: string,
    oldVal: string | null,
    newVal: string | null
  ) {
    if (oldVal === newVal) return;
    switch (attr) {
      case 'name':
        this.#name = newVal;
        break;
      case 'size':
        if (newVal === 'small' || newVal === 'medium' || newVal === 'large') {
          this.#size = newVal;
        } else {
          this.#size = 'medium';
        }
        break;
      case 'spin':
        this.#spin = newVal;
        break;
    }
    render(this.#template, this.#shadow);
  }

  connectedCallback() {
    attachStyles(this.#shadow, IconElement.styles.toString());
    render(this.#template, this.#shadow);
  }

  get #iconAttributes() {
    return {
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      width: sizeMap[this.#size || 'medium'],
      height: sizeMap[this.#size || 'medium'],
      fill: 'none',
    };
  }

  get #template() {
    const iconFactory = getIcon(this.#name || 'HelpCircle');
    const attrs = this.#iconAttributes;
    const svgNode = iconFactory(attrs);
    const spin = this.#spin !== null && this.#spin !== undefined;
    const spinClass = spin ? 'spin' : '';
    const svgElement = createElement(svgNode);

    if (spinClass && svgElement instanceof SVGElement) {
      svgElement.classList.add('spin');
    }

    if (svgElement instanceof SVGElement) {
      svgElement.setAttribute('width', attrs.width);
      svgElement.setAttribute('height', attrs.height);
    }

    return html`
      <span class="container ${spinClass}" part="container">
        ${svgElement}
      </span>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: inline-block;
        width: min-content;
        color: inherit;
      }

      .container svg {
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
        --spin-duration: 3s;
        animation: spin var(--spin-duration) linear infinite;
      }
    `;
  }
}

customElements.define('un-icon', IconElement);
