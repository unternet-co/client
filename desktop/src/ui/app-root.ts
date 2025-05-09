import { html, render } from 'lit';
import './top-bar/top-bar';
import './workspaces/workspace-view';
import './app-root.css';
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
      <workspace-view .key=${ws.id} for=${ws.id} active></workspace-view>
    `;

    render(template, this);
  }
}

customElements.define('app-root', AppRoot);
