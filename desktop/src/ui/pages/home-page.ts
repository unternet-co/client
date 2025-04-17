import { html, render } from 'lit';
import { formatTimestamp } from '../../common/utils/index';
import { Workspace, WorkspaceModel } from '../../workspaces';
import { TabModel } from '../../tabs';
import { dependencies } from '../../common/dependencies';
import { Kernel } from '../../ai/kernel';
import { ModalService } from '../../modals/modal-service';
import cn from 'classnames';
import { DisposableGroup } from '../../common/disposable';
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
          ></un-input>
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

    if (this.workspaces.length === 0 && filterQuery.length) {
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

    const workspace = this.workspaceModel.get(workspaceId);
    if (!workspace) return;

    const modal = this.modalService.create({
      title: `Delete ${workspace.title}`,
    });

    const handleCancel = () => {
      this.modalService.close(modal.id);
    };

    const handleDelete = () => {
      this.workspaceModel.delete(workspaceId);
      this.modalService.close(modal.id);
    };

    const container = document.createElement('div');
    container.className = 'delete-confirmation';
    modal.contents.appendChild(container);

    render(
      html`
        <p>
          Are you sure you want to delete <strong>${workspace.title}</strong>?
          This action cannot be undone.
        </p>
        <div class="button-container">
          <un-button type="secondary" @click=${handleCancel}>Cancel</un-button>
          <un-button type="negative" @click=${handleDelete}>Delete</un-button>
        </div>
      `,
      container
    );
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
}

customElements.define('home-page', HomePage);
