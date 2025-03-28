import { CommandSubmitEvent } from './command-input';
import './command-input';
import './interaction-history';
import './workspace-view.css';
import './resource-bar';
import { html, render } from 'lit';
import { Workspace } from '../../models/workspaces';
import { Kernel } from '../../kernel';
import { dependencies } from '../../base/dependencies';

export class WorkspaceView extends HTMLElement {
  workspaceId: Workspace['id'];
  kernel = dependencies.resolve<Kernel>('Kernel');
  static observedAttributes = ['for'];

  // TODO: Implement dependency injection with decorators
  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';
    render(this.template, this);
  }

  handleCommandSubmit(e: CommandSubmitEvent) {
    this.kernel.handleInput(this.workspaceId, e.input);
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
}

customElements.define('workspace-view', WorkspaceView);
