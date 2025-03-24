import { html, render } from 'lit';
import './home-page.css';
import { Workspace, WorkspaceModel } from '../../models/workspaces';
import { TabModel } from '../../models/tabs';
import { dependencies } from '../../base/dependencies';

export class HomePage extends HTMLElement {
  workspaceModel: WorkspaceModel;
  tabModel: TabModel;

  constructor() {
    super();
    this.workspaceModel = dependencies.resolve('WorkspaceModel');
    this.tabModel = dependencies.resolve('TabModel');
  }

  connectedCallback() {
    render(this.template, this);
    this.updateWorkspaces(this.workspaceModel.all());
  }

  updateWorkspaces(workspaces: Workspace[]) {
    const template = workspaces.map((workspace) => {
      return html`<li @click=${() => this.tabModel.activate(workspace.id)}>
        ${workspace.title}
      </li>`;
    });

    render(template, this);
  }

  get template() {
    return html`
      <command-input></command-input>
      <ul class="recent-workspaces"></ul>
    `;
  }
}

customElements.define('home-page', HomePage);
