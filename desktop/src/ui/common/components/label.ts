import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

export type LabelSize = 'small' | 'medium';
export type LabelVariant = 'default' | 'required' | 'optional';

export class LabelElement extends LitElement {
  for: string = '';
  text: string = '';
  size: LabelSize = 'medium';
  variant: LabelVariant = 'default';

  static get properties() {
    return {
      for: { type: String },
      text: { type: String },
      size: { type: String },
      variant: { type: String },
    };
  }

  constructor() {
    super();
    this.size = 'medium';
    this.variant = 'default';
  }

  render() {
    const labelClasses = {
      label: true,
      [`label--${this.size}`]: this.size !== 'medium',
      [`label--${this.variant}`]: this.variant !== 'default',
    };

    const hasSlotContent = this.hasChildNodes();
    const showText = !hasSlotContent && this.text;

    // Determine if we need to show required/optional indicators
    const requiredIndicator =
      this.variant === 'required'
        ? html`<span class="required-indicator" aria-hidden="true">*</span>`
        : '';
    const optionalIndicator =
      this.variant === 'optional'
        ? html`<span class="optional-indicator" aria-hidden="true"
            >(optional)</span
          >`
        : '';

    return html`
      <label
        class=${classMap(labelClasses)}
        for=${this.for}
        aria-required=${this.variant === 'required' ? 'true' : 'false'}
      >
        <span class="label-content">
          ${showText ? this.text : html`<slot></slot>`} ${requiredIndicator}
          ${optionalIndicator}
        </span>
      </label>
    `;
  }

  static get styles() {
    return css`
      :host {
        --label-color: var(--color-text-muted);
      }

      .label-content {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--label-color);
      }

      .required-indicator {
        color: var(--color-error-600);
        font-weight: 700;
      }

      .optional-indicator {
        color: var(--color-text-disabled);
        font-size: var(--text-xs);
        font-weight: 400;
      }

      .label--small .label-content {
        font-size: var(--text-xs);
      }
    `;
  }
}

customElements.define('un-label', LabelElement);
