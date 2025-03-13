import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './top-bar.css';
import './tab-strip';

@customElement('top-bar')
export class TopBar extends LitElement {
  renderRoot = this;

  render() {
    return html`<tab-strip></tab-strip>`;
  }
}
