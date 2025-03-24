import { html, render } from 'lit';
import './home-page.css';
import { Workspace, WorkspaceModel } from '../../models/workspaces';
import { TabModel } from '../../models/tabs';
import { dependencies } from '../../base/dependencies';

export class HomePage extends HTMLElement {
  private workspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private tabModel = dependencies.resolve<TabModel>('TabModel');
  private recentContainer: HTMLUListElement;

  connectedCallback() {
    render(this.template, this);
    this.recentContainer = this.querySelector(
      '.recent-workspaces'
    ) as HTMLUListElement;
    this.updateWorkspaces();
    this.workspaceModel.subscribe(this.updateWorkspaces.bind(this));
  }

  updateWorkspaces() {
    const workspaces = this.workspaceModel.all();
    const template = workspaces.map((workspace) => {
      return html`<li @click=${() => this.tabModel.create(workspace.id)}>
        ${workspace.title}
      </li>`;
    });

    render(template, this.recentContainer);
  }

  get template() {
    return html`
      <command-input></command-input>
      <ul class="recent-workspaces"></ul>
    `;
  }
}

customElements.define('home-page', HomePage);
