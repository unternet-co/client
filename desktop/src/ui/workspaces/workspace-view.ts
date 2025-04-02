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

  handleFileUpload(e: InputEvent) {
    console.log(e);
  }

  get template() {
    return html`
      <div class="workspace-content">
        <interaction-history for=${this.workspaceId}></interaction-history>
      </div>
      <div class="command-bar">
        <div class="command-bar__content">
          <command-input
            @submit=${this.handleCommandSubmit.bind(this)}
          ></command-input>
          <div class="command-bar__upload">
            <label for="command-bar__upload__input">
              <un-icon name="upload"></un-icon>
            </label>

            <input
              id="command-bar__upload__input"
              type="file"
              @change=${this.handleFileUpload}
            />
          </div>
        </div>
      </div>
      <resource-bar for=${this.workspaceId}></resource-bar>
    `;
  }
}

customElements.define('workspace-view', WorkspaceView);
