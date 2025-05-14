import { html, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { WorkspaceModel } from '../../models/workspace-model';
import { ModalService } from '../../modals/modal-service';
import { ChangeEvent, SelectElement } from '../common/select';
import './workspace-selector.css';

export class WorkspaceSelector extends HTMLElement {
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  modalService = dependencies.resolve<ModalService>('ModalService');
  selectedWorkspace: string | null = null;

  connectedCallback() {
    this.workspaceModel.subscribe(this.update.bind(this));
    this.update();
  }

  handleWorkspaceSelect(e: ChangeEvent) {
    const newId = e.value;

    if (newId === '+') {
      this.modalService.open('new-workspace');
    } else if (newId === '-') {
      const target = e.target as SelectElement;
      this.modalService.open('settings');
      target.value = this.selectedWorkspace;
    } else if (newId && newId !== this.workspaceModel.activeWorkspaceId) {
      this.workspaceModel.activate(newId);
    }
  }

  update() {
    const workspaces = this.workspaceModel.all();
    const activeWorkspaceId =
      this.workspaceModel.activeWorkspaceId || (workspaces[0]?.id ?? '');
    this.selectedWorkspace = activeWorkspaceId;

    const workspaceOptions = [
      ...workspaces.map((ws) => ({ value: ws.id, label: ws.title })),
      { type: 'separator' },
      { value: '-', label: 'Edit workspace...' },
      { value: '+', label: 'New workspace...' },
    ];

    const template = html`
      <un-select
        native
        variant="ghost"
        value=${activeWorkspaceId}
        .options=${workspaceOptions}
        placeholder="Select workspace"
        @change=${this.handleWorkspaceSelect.bind(this)}
      >
      </un-select>
    `;

    render(template, this);
  }
}

customElements.define('workspace-selector', WorkspaceSelector);
