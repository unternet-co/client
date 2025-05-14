import { html, render } from 'lit';
import './workspace-selector';
import './command-input';
import './command-bar.css';
import './resource-bar';

export class CommandBar extends HTMLElement {
  static get observedAttributes() {
    return ['for'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  handleHome() {
    // TODO: A little hacky, but works. Handle this better in future!
    window.location.href = '/';
  }

  render() {
    const workspaceId = this.getAttribute('for') || null;
    const template = html`
      <div class="left-section">
        <workspace-selector></workspace-selector>
      </div>
      <div class="center-section">
        <command-input for=${workspaceId}></command-input>
      </div>
      <div class="right-section">
        <un-button
          icon="home"
          variant="ghost"
          @mousedown=${this.handleHome.bind(this)}
        ></un-button>
      </div>
    `;

    render(template, this);
  }
}

customElements.define('command-bar', CommandBar);
