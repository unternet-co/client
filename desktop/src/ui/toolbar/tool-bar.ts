import { html, render } from 'lit';
import './workspace-selector';
import './command-input';
import './tool-bar.css';
import './resource-bar';

export class ToolBar extends HTMLElement {
  static get observedAttributes() {
    return ['for'];
  }

  connectedCallback() {
    this.update();
  }

  attributeChangedCallback() {
    this.update();
  }

  update() {
    const workspaceId = this.getAttribute('for') || null;
    const template = html`
      <div class="command-bar">
        <div class="left-section">
          <workspace-selector></workspace-selector>
        </div>
        <div class="center-section">
          <command-input for=${workspaceId}></command-input>
        </div>
        <div class="right-section">
          <!-- Right-side elements would go here -->
        </div>
      </div>
      <resource-bar for=${workspaceId}></resource-bar>
    `;

    render(template, this);
  }
}

customElements.define('tool-bar', ToolBar);
