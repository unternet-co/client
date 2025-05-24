import { html, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { WorkspaceService } from '../../workspaces/workspace-service';
import { ModalService } from '../common/modals/modal-service';
import { ChangeEvent, SelectElement } from '../common/select';
import './workspace-selector.css';

export class WorkspaceSelector extends HTMLElement {
  workspaceService = dependencies.resolve<WorkspaceService>('WorkspaceService');
  modalService = dependencies.resolve<ModalService>('ModalService');
  selectedWorkspaceId: string | null = null;
  renaming = false;
  renameValue = '';

  connectedCallback() {
    this.workspaceService.onUpdateWorkspaces(this.update.bind(this));
    this.update();
  }

  openDeleteModal() {
    const ws = this.workspaceService.activeWorkspaceModel;
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
      (e.target as SelectElement).value = this.selectedWorkspaceId;
      this.modalService.open('settings');
    } else if (
      newId &&
      newId !== this.workspaceService.activeWorkspaceModel.id
    ) {
      this.workspaceService.activate(newId);
    }
  };

  update() {
    const workspaces = this.workspaceService.getWorkspaces();
    this.selectedWorkspaceId = this.workspaceService.activeWorkspaceModel.id;

    const workspaceOptions = [
      ...workspaces.map((ws) => ({ value: ws.id, label: ws.title })),
      { type: 'separator' },
      { value: '-', label: 'Edit workspace...' },
      { value: '+', label: 'New workspace...' },
    ];

    const template = html`<un-select
      native
      variant="ghost"
      value=${this.selectedWorkspaceId}
      .options=${workspaceOptions}
      placeholder="Select workspace"
      @change=${this.handleWorkspaceSelect}
    ></un-select> `;

    render(template, this);
  }
}

customElements.define('workspace-selector', WorkspaceSelector);
