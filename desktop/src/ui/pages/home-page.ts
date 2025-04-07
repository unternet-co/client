import { html, render } from 'lit';
import { formatTimestamp } from '../../utils';
import { Workspace, WorkspaceModel } from '../../models/workspaces';
import { TabModel } from '../../models/tabs';
import { dependencies } from '../../base/dependencies';
import { ModalService } from '../../services/modal-service';
import cn from 'classnames';
import { DisposableGroup } from '../../base/disposable';
import './home-page.css';
import '../common/button';
import '../common/input';

export class HomePage extends HTMLElement {
  private workspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private tabModel = dependencies.resolve<TabModel>('TabModel');
  private modalService = dependencies.resolve<ModalService>('ModalService');
  private recentContainer: HTMLUListElement;
  private filterInput: HTMLInputElement;
  private selectedIndex: number = -1;
  private workspaces: Workspace[] = [];
  private disposables = new DisposableGroup();

  connectedCallback() {
    render(this.template, this);

    this.recentContainer = this.querySelector(
      '.recent-workspaces'
    ) as HTMLUListElement;
    this.filterInput = this.querySelector('.filter-input') as HTMLInputElement;

    this.updateWorkspaces();
    this.disposables.add(
      this.workspaceModel.subscribe(() => this.updateWorkspaces())
    );
  }

  disconnectedCallback() {
    this.disposables.dispose();
  }

  get template() {
    return html`
      <div class="home-header">
        <div class="search-container">
          <un-input
            type="search"
            class="filter-input"
            placeholder="Filter workspaces..."
            @input=${this.handleFilterInput.bind(this)}
            @keydown=${this.handleKeyDown.bind(this)}
            @blur=${this.handleFilterBlur.bind(this)}
          />
        </div>
        <un-button @click=${this.handleCreateWorkspace.bind(this)}>
          <un-icon name="plus"></un-icon>
          New Workspace
        </un-button>
      </div>
      <ul class="recent-workspaces"></ul>
    `;
  }

  handleFilterInput(e: InputEvent) {
    this.selectedIndex = -1;
    const target = e.target as HTMLInputElement;
    this.updateWorkspaces(target.value);
  }

  handleFilterBlur() {
    this.selectedIndex = -1;
    this.updateWorkspaces(this.filterInput?.value || '');
  }

  updateWorkspaces(filterQuery?: string) {
    this.workspaces = this.workspaceModel
      .all()
      .filter((workspace) =>
        workspace.title
          .toLowerCase()
          .includes((filterQuery || '').toLowerCase())
      )
      // Sort by modified (most recent first)
      .sort((a, b) => (b.modified || 0) - (a.modified || 0));

    if (this.workspaces.length === 0) {
      render(
        html`<li class="no-workspaces-message">
          No workspaces found matching "${this.filterInput?.value}"
        </li>`,
        this.recentContainer
      );
    } else {
      render(
        this.workspaces.map(this.workspaceTemplate.bind(this)),
        this.recentContainer
      );
    }
  }

  handleClickDelete(e: PointerEvent, workspaceId: Workspace['id']) {
    e.preventDefault();
    e.stopPropagation();
    // Fixes bug where hitting enter opens more modals
    // TODO: Move this to a modal visibility trigger, register it once and reveal
    // If status is open, it doesn't open
    if (e.pointerId > 0) this.createDeleteModal(workspaceId);
  }

  handleKeyDown(e: KeyboardEvent) {
    // TODO: Refactor with new keyboard shortcut service
    const len = this.workspaces.length;
    if (len === 0) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex =
          this.selectedIndex <= 0
            ? len - 1 // cycle to end
            : this.selectedIndex - 1;
        this.updateWorkspaces(this.filterInput.value);
        break;
      case 'Tab': // same as ArrowDown
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex =
          this.selectedIndex >= len - 1
            ? 0 // cycle to beginning
            : this.selectedIndex + 1;
        this.updateWorkspaces(this.filterInput.value);
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
          this.updateWorkspaces(this.filterInput.value);
        } else {
          // Clear the filter input when Escape is pressed and no workspace is selected
          this.filterInput.value = '';
          this.updateWorkspaces('');
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

  handleCreateWorkspace() {
    const workspace = this.workspaceModel.create();
    this.tabModel.create(workspace.id);
  }

  private workspaceTemplate(workspace: Workspace, index: number) {
    const className = cn('workspace', {
      selected: index === this.selectedIndex,
    });

    const modifiedString = !workspace.accessed
      ? 'Creating new workspace...'
      : `Last modified: ${formatTimestamp(workspace.modified)}`;

    return html`
      <li class=${className} @click=${() => this.openWorkspace(workspace.id)}>
        <div class="workspace-title">${workspace.title}</div>
        <div class="workspace-metadata">
          <span class="last-modified">${modifiedString}</span>
        </div>
        <un-button
          type="secondary"
          class="delete-button"
          @click=${(e: PointerEvent) => this.handleClickDelete(e, workspace.id)}
          title="Delete workspace"
        >
          <un-icon name="delete"></un-icon>
        </un-button>
      </li>
    `;
  }

  private createDeleteModal(workspaceId: string) {
    // Create confirmation modal
    const modal = this.modalService.create({ title: 'Delete Workspace' });

    // Add confirmation content
    const content = document.createElement('div');
    content.classList.add('delete-confirmation');

    const message = document.createElement('p');
    message.textContent =
      'Are you sure you want to delete this workspace? This action cannot be undone.';
    content.appendChild(message);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const cancelButton = document.createElement('button');
    cancelButton.classList.add('cancel-button');
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => modal.close();

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-confirm-button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => {
      this.workspaceModel.delete(workspaceId);
      modal.close();
    };

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(deleteButton);
    content.appendChild(buttonContainer);

    modal.contents.appendChild(content);
  }
}

customElements.define('home-page', HomePage);
