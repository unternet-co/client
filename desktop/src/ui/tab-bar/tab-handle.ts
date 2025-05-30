import './tab-handle.css';
import { html, render } from 'lit';
import { Tab } from './types';

class SelectEvent extends Event {
  constructor() {
    super('select');
  }
}

export class TabHandle extends HTMLElement {
  connectedCallback() {
    this.addEventListener('mousedown', this.handleSelect.bind(this));
  }

  handleSelect() {
    this.dispatchEvent(new SelectEvent());
  }

  set tab(tab: Tab) {
    this.render(tab);
  }

  render(tab: Tab) {
    const template = html`${tab.title}`;

    render(template, this);
  }
}

customElements.define('tab-handle', TabHandle);
