import { html, render } from 'lit';
import './home-page.css';
import { Workspace, WorkspaceModel } from '../../models/workspaces';
import { TabModel } from '../../models/tabs';
import { dependencies } from '../../base/dependencies';
import { CommandSubmitEvent } from '../workspaces/command-input';
import { Kernel } from '../../kernel';

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
      return html`<li @click=${() => {
        const existingTab = this.tabModel.has(workspace.id);
        if (existingTab) {
          this.tabModel.activate(workspace.id);
        } else {
          this.tabModel.create(workspace.id);
        }
      }}>
        ${workspace.title}
      </li>`;
    });

    render(template, this.recentContainer);
  }

  async handleCommandSubmit(e: CommandSubmitEvent) {
    const workspace = this.workspaceModel.create();
    
    // Activate workspace before creating interaction
    await this.workspaceModel.activate(workspace.id);
    
    // Send initial command to kernel
    const kernel = dependencies.resolve<Kernel>('Kernel');
    await kernel.handleInput(workspace.id, { text: e.value });
    
    // Create tab after interaction is created
    this.tabModel.create(workspace.id);
  }

  get template() {
    return html`
      <command-input @submit=${this.handleCommandSubmit.bind(this)}></command-input>
      <ul class="recent-workspaces"></ul>
    `;
  }
}

customElements.define('home-page', HomePage);
