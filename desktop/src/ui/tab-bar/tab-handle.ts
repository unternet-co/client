import { html, render } from 'lit';
import { Tab } from './types';

export class TabHandle extends HTMLElement {
  set tab(tab: Tab) {
    this.render(tab);
  }

  render(tab: Tab) {
    const template = html`${tab.title}`;

    render(template, this);
  }
}
