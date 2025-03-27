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
  private newWorkspaceId: string | null = null;
  private pendingWorkspace: { id: string, title: string } | null = null;

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
    
    // Get all actual workspaces
    this.workspaces = this.workspaceModel.all()
      .filter(workspace => workspace.title.toLowerCase().includes(filterValue))
      // Sort by lastOpenedAt (most recent first)
      .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));

    render(this.workspaceTemplate, this.recentContainer);
    
    // Clear the new workspace highlight after a delay
    if (this.newWorkspaceId && !this.pendingWorkspace) {
      setTimeout(() => {
        this.newWorkspaceId = null;
        this.updateWorkspaces();
      }, 3000); // Remove glow effect after 3 seconds
    }
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
    // Temporarily disable the command input
    if (this.commandInput) {
      (this.commandInput as any).disabled = true;
    }
    
    try {
      // Create a placeholder workspace item with a loading message
      const tempId = `pending-${Date.now()}`;
      this.pendingWorkspace = {
        id: tempId,
        title: 'Creating new workspace...'
      };
      this.newWorkspaceId = tempId;
      this.updateWorkspaces();
      
      // Actually create the workspace
      const workspace = this.workspaceModel.create();
      await this.workspaceModel.activate(workspace.id);

      const kernel = dependencies.resolve<Kernel>('Kernel');
      await kernel.handleInput(workspace.id, { text: command });
      
      // Replace placeholder with the real workspace
      this.pendingWorkspace = null;
      this.newWorkspaceId = workspace.id;
      
      this.tabModel.create(workspace.id);
      this.updateWorkspaces();
    } finally {
      // Re-enable the command input
      if (this.commandInput) {
        (this.commandInput as any).disabled = false;
      }
    }
  }

  private formatTimestamp(timestamp: number): string {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private get workspaceTemplate() {
    const workspacesToRender = [...this.workspaces];
    
    // Add the pending workspace at the beginning of the list if it exists
    if (this.pendingWorkspace) {
      workspacesToRender.unshift(this.pendingWorkspace as any);
    }
    
    return html`
      ${workspacesToRender.map((workspace, index) => html`
        <li 
          class="workspace ${index === this.selectedIndex ? 'selected' : ''} ${workspace.id === this.newWorkspaceId ? 'new-workspace' : ''}"
          @click=${() => this.openWorkspace(workspace.id)}>
          <div class="workspace-title">${workspace.title}</div>
          <div class="workspace-metadata">
            ${workspace.lastOpenedAt ? 
              html`<span class="last-opened">Last opened: ${this.formatTimestamp(workspace.lastOpenedAt)}</span>` : 
              ''}
            ${workspace.createdAt ? 
              html`<span class="created-at">Created: ${this.formatTimestamp(workspace.createdAt)}</span>` : 
              ''}
          </div>
        </li>
      `)}
    `;
  }

  get template() {
    return html`
      <command-input @submit=${this.handleCommandSubmit.bind(this)}></command-input>
      <ul class="recent-workspaces"></ul>
    `;
  }
}

customElements.define('home-page', HomePage);
