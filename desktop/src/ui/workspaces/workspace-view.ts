import { CommandSubmitEvent } from './command-input';
import { kernel } from '../../kernel';
import { Workspace } from '../../data-types';
import './command-input';
import './interaction-history';
import './workspace-view.css';
import { html, render } from 'lit';

export class WorkspaceView extends HTMLElement {
  workspaceId: Workspace['id'];

  static observedAttributes = ['for'];

  // TODO: Implement dependency injection with decorators
  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';
    render(this.template, this);
  }

  get template() {
    return html`
      <div class="workspace-content">
        <interaction-history for=${this.workspaceId}></interaction-history>
      </div>
      <div class="command-bar">
        <command-input
          @submit=${this.handleCommandSubmit.bind(this)}
        ></command-input>
      </div>
      <resource-bar for=${this.workspaceId}></resource-bar>
    `;
  }

  handleCommandSubmit(e: CommandSubmitEvent) {
    kernel.handleInput(this.workspaceId, { text: e.value });
  }
}

customElements.define('workspace-view', WorkspaceView);
