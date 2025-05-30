import { html, render } from 'lit';
import './tab-handle';
import { Tab } from './types';

const tabs: Tab[] = [{ title: 'hello' }, { title: 'world' }];

export class TabBar extends HTMLElement {
  tabs: Tab[] = [];

  connectedCallback() {
    this.tabs = tabs;
    this.render();
  }

  render() {
    const template = this.tabs.map(
      (t) => html`<tab-handle .tab=${t}></tab-handle>`
    );
    render(template, this);
  }
}

customElements.define('tab-bar', TabBar);
