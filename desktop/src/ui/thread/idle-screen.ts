import { html, render } from 'lit';
import './idle-screen.css';

export class IdleScreenElement extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const template = html`
      <!-- <input type="text" placeholder="Search or type command" /> -->
    `;

    render(template, this);
  }
}

customElements.define('idle-screen', IdleScreenElement);
