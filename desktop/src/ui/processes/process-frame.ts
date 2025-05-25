import { ProcessContainer } from '@unternet/kernel';
import { guard } from 'lit/directives/guard.js';
import './process-frame.css';
import './process-view';
import { getResourceIcon } from '../../common/utils';
import { html, HTMLTemplateResult, render } from 'lit';

/**
 * Custom element that displays a process container with its icon, title, and status.
 *
 * @element process-frame
 * @attr {boolean} noheader - When present, hides the process header
 */
class ProcessFrame extends HTMLElement {
  /**
   * Sets the process to be displayed and renders it
   * @param {ProcessContainer} process - The process container to render
   */
  set process(process: ProcessContainer) {
    this.render(process);
  }

  private handleResume(process: ProcessContainer) {
    process.resume();
    this.render(process);
  }

  private render(process: ProcessContainer) {
    const iconSrc = getResourceIcon(process);
    const isHeaderVisible = this.getAttribute('noheader') === null;
    const iconTemplate = html`<img src=${iconSrc} />`;

    let bodyTemplate: HTMLTemplateResult;

    if (process.status === 'running') {
      bodyTemplate = html`<process-view .process=${process}></process-view>`;
    } else {
      bodyTemplate = html`<button @click=${() => this.handleResume(process)}>
        Click to resume
      </button>`;
    }

    const header = html`<div class="process-header">
      ${iconTemplate} ${process.title}
    </div>`;

    const template = guard(
      [process.pid, process.status],
      () => html` ${isHeaderVisible ? header : null} ${bodyTemplate} `
    );

    render(template, this);
  }
}

customElements.define('process-frame', ProcessFrame);
