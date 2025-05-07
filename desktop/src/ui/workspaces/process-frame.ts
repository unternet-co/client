import { ProcessContainer } from '@unternet/kernel';
import { guard } from 'lit/directives/guard.js';

import './process-frame.css';
import './process-view';
import { getResourceIcon } from '../../common/utils';
import { html, HTMLTemplateResult, render } from 'lit';

class ProcessFrame extends HTMLElement {
  set process(process: ProcessContainer) {
    this.render(process);
  }

  handleResume(process: ProcessContainer) {
    process.resume();
    this.render(process);
  }

  render(process: ProcessContainer) {
    const iconSrc = getResourceIcon(process);
    const iconTemplate = html`<img src=${iconSrc} />`;

    let bodyTemplate: HTMLTemplateResult;

    if (process.status === 'running') {
      bodyTemplate = html`<process-view .process=${process}></process-view>`;
    } else {
      bodyTemplate = html`<button @click=${() => this.handleResume(process)}>
        Click to resume
      </button>`;
    }

    const template = guard(
      [process.pid, process.status],
      () => html`
        <div class="process-header">${iconTemplate} ${process.title}</div>
        ${bodyTemplate}
      `
    );

    render(template, this);
  }
}

customElements.define('process-frame', ProcessFrame);
