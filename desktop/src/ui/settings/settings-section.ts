import './styles.css';
import { html, HTMLTemplateResult, render } from 'lit';
import { createEl } from '../../common/utils';

export abstract class SettingsSection {
  element = createEl('div', { className: 'settings-section' });
  innerContainerEl = createEl('div', { className: 'settings-section-content' });

  constructor(title: string) {
    const template = html`
      <h2>${title}</h2>
      ${this.innerContainerEl}
    `;

    render(template, this.element);
  }

  render() {
    render(this.template, this.innerContainerEl);
  }

  abstract get template(): HTMLTemplateResult | HTMLTemplateResult[];
  abstract save(): void;
}
