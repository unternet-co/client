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
  private commandInput: HTMLElement;
  private selectedIndex: number = -1;
  private workspaces: Workspace[] = [];

  connectedCallback() {
    render(this.template, this);

    this.recentContainer = this.querySelector(
      '.recent-workspaces'
    ) as HTMLUListElement;

    this.commandInput = this.querySelector(
      'command-input'
    ) as HTMLElement;
    
    this.updateWorkspaces();
    this.workspaceModel.subscribe(this.updateWorkspaces.bind(this));
    
    this.commandInput.addEventListener('change', () => {
      this.selectedIndex = -1;
      this.updateWorkspaces();
    });
    this.commandInput.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeyDown(e));
    this.commandInput.addEventListener('blur', () => {
      this.selectedIndex = -1;
      this.updateWorkspaces();
    });
  }

  updateWorkspaces() {
    const filterValue = (this.commandInput as any).value?.toLowerCase() || '';
    this.workspaces = this.workspaceModel.all()
      .filter(workspace => workspace.title.toLowerCase().includes(filterValue));

    render(this.workspaceTemplate, this.recentContainer);
  }

  handleKeyDown(e: KeyboardEvent) {
    const len = this.workspaces.length;
    if (len === 0) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = this.selectedIndex <= 0 ? 
          len - 1 : // cycle to end
          this.selectedIndex - 1;
        this.updateWorkspaces();
        break;
      case 'Tab': // same as ArrowDown
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = this.selectedIndex >= len - 1 ? 
          0 : // cycle to beginning
          this.selectedIndex + 1;
        this.updateWorkspaces();
        break;
      case 'Enter':
        if (this.selectedIndex >= 0) {
          this.openWorkspace(this.workspaces[this.selectedIndex].id);
          return;
        }
        break;
      case 'Escape':
        if (this.selectedIndex > -1) {
          this.selectedIndex = -1;
          e.preventDefault();
          this.updateWorkspaces();
        }
        break;
    }
  }

  openWorkspace(id: string) {
    const existingTab = this.tabModel.has(id);
    if (existingTab) {
      this.tabModel.activate(id);
    } else {
      this.tabModel.create(id);
    }
  }

  async handleCommandSubmit(e: CommandSubmitEvent) {
    if (this.selectedIndex >= 0) {
      this.openWorkspace(this.workspaces[this.selectedIndex].id);
      return;
    }

    await this.createWorkspaceWithCommand(e.value);
  }

  private async createWorkspaceWithCommand(command: string) {
    const workspace = this.workspaceModel.create();
    await this.workspaceModel.activate(workspace.id);

    const kernel = dependencies.resolve<Kernel>('Kernel');
    await kernel.handleInput(workspace.id, { text: command });

    this.tabModel.create(workspace.id);
  }

  private get workspaceTemplate() {
    return this.workspaces.map((workspace, index) => html`
      <li 
        class="${index === this.selectedIndex ? 'selected' : ''}"
        @click=${() => this.openWorkspace(workspace.id)}>
        ${workspace.title}
      </li>
    `);
  }

  get template() {
    return html`
      <style>
        .recent-workspaces li {
          cursor: pointer;
          padding: 8px;
        }
        .recent-workspaces li:hover,
        .recent-workspaces li.selected {
          background: var(--hover-bg-color, #f0f0f0);
        }
      </style>
      <command-input @submit=${this.handleCommandSubmit.bind(this)}></command-input>
      <ul class="recent-workspaces"></ul>
    `;
  }
}

customElements.define('home-page', HomePage);
