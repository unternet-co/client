import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { icon, IconName } from './icon-registry';

export type IconSize = 'small' | 'medium' | 'large';
const sizeMap = {
  small: '12',
  medium: '15',
  large: '18',
};

@customElement('un-icon')
export class IconElement extends LitElement {
  @property({ type: String })
  accessor icon: IconName | null = null;

  @property({ type: String })
  accessor size: IconSize = 'medium';

  @property({ type: Boolean })
  accessor spin: boolean = false;

  render() {
    const iconRenderer = icon(this.icon || 'help');
    const size = sizeMap[this.size || 'medium'];

    // Use the icon renderer with size overrides
    const svgElement = iconRenderer({
      width: size,
      height: size,
    });

    const spinClass = this.spin ? 'spin' : '';

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
