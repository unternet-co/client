import { html, render } from 'lit';
import './idle-screen';
import './workbench-view.css';

class Workbench extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const template = html`<idle-screen></idle-screen>`;
    render(template, this);
  }
}

customElements.define('workbench-view', Workbench);
