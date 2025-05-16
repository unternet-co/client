import { html, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { WorkspaceModel } from '../../models/workspace-model';
import { ModalService } from '../../modals/modal-service';
import { ChangeEvent, SelectElement } from '../common/select';
import { attachContextMenu } from '../common/context-menu';
import './workspace-selector.css';

export class WorkspaceSelector extends HTMLElement {
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  modalService = dependencies.resolve<ModalService>('ModalService');
  selectedWorkspace: string | null = null;
  renaming = false;
  renameValue = '';

  connectedCallback() {
    this.workspaceModel.subscribe(() => this.update());
    this.update();
    attachContextMenu(this, [
      {
        label: 'Rename workspace',
        value: 'rename',
        click: () => this.startRenaming(),
      },
      {
        label: 'Delete workspace',
        value: 'delete',
        click: () => this.openDeleteModal(),
      },
    ]);
  }

  startRenaming() {
    const ws = this.workspaceModel.get(this.selectedWorkspace!);
    this.renameValue = ws.title;
    this.renaming = true;
    this.update();
    setTimeout(
      () =>
        (
          this.querySelector('un-input input') as HTMLInputElement | null
        )?.focus(),
      0
    );
  }

  openDeleteModal() {
    const ws = this.workspaceModel.get(this.selectedWorkspace!);
    this.modalService.open('workspace-delete', {
      'workspace-id': ws.id,
      'workspace-title': ws.title,
    });
  }

  handleWorkspaceSelect = (e: ChangeEvent) => {
    const newId = e.value;
    if (newId === '+') {
      this.modalService.open('new-workspace');
    } else if (newId === '-') {
      (e.target as SelectElement).value = this.selectedWorkspace;
      this.modalService.open('settings');
    } else if (newId && newId !== this.workspaceModel.activeWorkspaceId) {
      this.workspaceModel.activate(newId);
    }
  };

  handleRenameInput = (e: Event) => {
    this.renameValue = (e.target as HTMLInputElement).value;
  };

  handleRenameKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      this.renaming = false;
      this.update();
      (e.target as HTMLInputElement).blur();
    }
  };

  finishRenaming = () => {
    if (this.renameValue.trim() && this.selectedWorkspace) {
      this.workspaceModel.setTitle(
        this.renameValue.trim(),
        this.selectedWorkspace
      );
    }
    this.renaming = false;
    this.update();
  };

  update() {
    const workspaces = this.workspaceModel.all();
    const activeWorkspaceId =
      this.workspaceModel.activeWorkspaceId || workspaces[0]?.id || '';
    this.selectedWorkspace = activeWorkspaceId;
    const workspaceOptions = [
      ...workspaces.map((ws) => ({ value: ws.id, label: ws.title })),
      { type: 'separator' },
      { value: '-', label: 'Edit workspace...' },
      { value: '+', label: 'New workspace...' },
    ];
    render(
      this.renaming
        ? html`<un-input
            variant="ghost"
            .value=${this.renameValue}
            @input=${this.handleRenameInput}
            @change=${this.finishRenaming}
            @keydown=${this.handleRenameKeydown}
          ></un-input>`
        : html`<un-select
            native
            variant="ghost"
            value=${activeWorkspaceId}
            .options=${workspaceOptions}
            placeholder="Select workspace"
            @change=${this.handleWorkspaceSelect}
          ></un-select>`,
      this
    );
  }
}

customElements.define('workspace-selector', WorkspaceSelector);
