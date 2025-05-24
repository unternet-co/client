import { html, render } from 'lit';
import './top-bar/top-bar';
import './toolbar/command-bar';
import './app-root.css';
import './thread/thread-view';
import './workbench/workbench-view';
import { dependencies } from '../common/dependencies';
import { WorkspaceService } from '../workspaces/workspace-service';

export class AppRoot extends HTMLElement {
  workspaceService = dependencies.resolve<WorkspaceService>('WorkspaceService');

  connectedCallback() {
    this.workspaceService.onActivateWorkspace(this.update.bind(this));
    this.update();
  }

  update() {
    const ws = this.workspaceService.activeWorkspaceModel;
    if (!ws) return;

    const template = html`
      <top-bar></top-bar>
      <div class="workspace-content">
        <workbench-view></workbench-view>
        <thread-view for=${ws.id}></thread-view>
      </div>
      <div class="toolbar">
        <command-bar for=${ws.id}></command-bar>
        <!-- <resource-bar for=${ws.id}></resource-bar> -->
      </div>
    `;

    render(template, this);
  }
}

customElements.define('app-root', AppRoot);
