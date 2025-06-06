import { html, render } from 'lit';
import './top-bar/top-bar';
import './toolbar/command-bar';
import './app-root.css';
import './thread/thread-view';
import { dependencies } from '../common/dependencies';
import { WorkspaceModel } from '../models/workspace-model';

export class AppRoot extends HTMLElement {
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');

  connectedCallback() {
    this.workspaceModel.subscribe(this.update.bind(this));
    this.update();
  }

  update() {
    const ws = this.workspaceModel.activeWorkspace;
    if (!ws) return;

    const template = html`
      <top-bar></top-bar>
      <div class="stack">
        <div class="workspace-content">
          <thread-view for=${ws.id}></thread-view>
        </div>
        <div class="toolbar">
          <command-bar for=${ws.id}></command-bar>
          <resource-bar for=${ws.id}></resource-bar>
        </div>
      </div>
    `;

    render(template, this);
  }
}

customElements.define('app-root', AppRoot);
