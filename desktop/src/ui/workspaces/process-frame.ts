import { ProcessContainer } from '@unternet/kernel';
import { guard } from 'lit/directives/guard.js';

import './process-frame.css';
import './process-view';
import { getResourceIcon } from '../../common/utils';
import { html, render } from 'lit';

class ProcessFrame extends HTMLElement {
  set process(process: ProcessContainer) {
    this.render(process);
  }

  render(process: ProcessContainer) {
    const iconSrc = getResourceIcon(process);
    const iconTemplate = html`<img src=${iconSrc} />`;

    const template = guard(
      [process.pid, process.state],
      () => html`
        <div class="process-header">${iconTemplate} ${process.title}</div>
        <process-view .process=${process}></process-view>
      `
    );

    render(template, this);
  }
}

customElements.define('process-frame', ProcessFrame);
