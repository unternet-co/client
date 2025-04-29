import { html, render } from 'lit';
import { formatTimestamp } from '../../common/utils/index';
import { WorkspaceRecord, WorkspaceModel } from '../../workspaces';
import { TabModel } from '../../tabs';
import { dependencies } from '../../common/dependencies';
import { ModalService } from '../../modals/modal-service';
import cn from 'classnames';
import { DisposableGroup } from '../../common/disposable';
import { ShortcutService } from '../../shortcuts/shortcut-service';
import './home-page.css';
import '../common/elements/button';
import '../common/elements/input';

export class HomePage extends HTMLElement {
  private workspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private tabModel = dependencies.resolve<TabModel>('TabModel');
  private modalService = dependencies.resolve<ModalService>('ModalService');
  private shortcutService =
    dependencies.resolve<ShortcutService>('ShortcutService');
  private recentContainer: HTMLUListElement;
  private filterInput: HTMLInputElement;
  private selectedIndex: number = -1;
  private workspaces: WorkspaceRecord[] = [];
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

    // Register keyboard shortcuts
    this.registerShortcuts();
  }

  disconnectedCallback() {
    this.disposables.dispose();
    this.deregisterShortcuts();
  }

  get template() {
    return html`
      <div class="home-header">
        <div class="search-container">
          <un-input
            type="search"
            class="filter-input"
            variant="flat"
            size="large"
            placeholder="Filter workspaces..."
            @input=${this.handleFilterInput.bind(this)}
            @blur=${this.handleFilterBlur.bind(this)}
          ></un-input>
        </div>
        <un-button
          size="large"
          icon="plus"
          @click=${this.handleCreateWorkspace.bind(this)}
        >
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
          ${filterQuery?.length
            ? `No workspaces found matching "${filterQuery}"`
            : `You haven't created any workspaces yet.`}
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

  handleClickDelete(e: PointerEvent, workspaceId: WorkspaceRecord['id']) {
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

  private registerShortcuts() {
    this.shortcutService.register('ArrowUp', this.handleArrowUp.bind(this));
    this.shortcutService.register('ArrowDown', this.handleArrowDown.bind(this));
    this.shortcutService.register('Enter', this.handleEnter.bind(this));
    this.shortcutService.register('Escape', this.handleEscape.bind(this));
  }

  private deregisterShortcuts() {
    this.shortcutService.deregister('ArrowUp', this.handleArrowUp.bind(this));
    this.shortcutService.deregister(
      'ArrowDown',
      this.handleArrowDown.bind(this)
    );
    this.shortcutService.deregister('Enter', this.handleEnter.bind(this));
    this.shortcutService.deregister('Escape', this.handleEscape.bind(this));
  }

  private handleArrowUp(e: KeyboardEvent) {
    const len = this.workspaces.length;
    if (len === 0) return;

    e.preventDefault();
    this.selectedIndex =
      this.selectedIndex <= 0
        ? len - 1 // cycle to end
        : this.selectedIndex - 1;
    this.updateWorkspaces(this.filterInput.value);
  }

  private handleArrowDown(e: KeyboardEvent) {
    const len = this.workspaces.length;
    if (len === 0) return;

    e.preventDefault();
    this.selectedIndex =
      this.selectedIndex >= len - 1
        ? 0 // cycle to beginning
        : this.selectedIndex + 1;
    this.updateWorkspaces(this.filterInput.value);
  }

  private handleEnter(e: KeyboardEvent) {
    if (this.selectedIndex >= 0 && this.workspaces.length > 0) {
      this.openWorkspace(this.workspaces[this.selectedIndex].id);
    }
  }

  private handleEscape(e: KeyboardEvent) {
    if (this.selectedIndex > -1) {
      this.selectedIndex = -1;
      e.preventDefault();
      this.updateWorkspaces(this.filterInput.value);
    } else {
      this.filterInput.value = '';
      this.updateWorkspaces('');
    }
  }

  handleWorkspaceKeyDown(e: KeyboardEvent, workspaceId: string) {
    const targetEl = e.target as HTMLElement;
    if (!targetEl.classList.contains('workspace')) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.openWorkspace(workspaceId);
        break;
      case 'Delete':
        this.handleClickDelete(e as unknown as PointerEvent, workspaceId);
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

  private workspaceTemplate(workspace: WorkspaceRecord, index: number) {
    const className = cn('workspace', {
      selected: index === this.selectedIndex,
    });

    const modifiedString = !workspace.accessed
      ? 'Creating new workspace...'
      : `Last modified: ${formatTimestamp(workspace.modified)}`;

    return html`
      <li
        class=${className}
        tabindex="0"
        @click=${() => this.openWorkspace(workspace.id)}
        @keydown=${(e: KeyboardEvent) =>
          this.handleWorkspaceKeyDown(e, workspace.id)}
        role="button"
        aria-label="Open workspace: ${workspace.title}"
      >
        <div class="workspace-title">${workspace.title}</div>
        <div class="workspace-metadata">
          <span class="last-modified">${modifiedString}</span>
        </div>
        <un-button
          type="ghost"
          class="delete-button"
          icon="delete"
          @click=${(e: PointerEvent) => this.handleClickDelete(e, workspace.id)}
          title="Delete workspace"
        >
        </un-button>
      </li>
    `;
  }
}

customElements.define('home-page', HomePage);
