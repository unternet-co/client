import { html, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { WorkspaceModel } from '../../workspaces';
import { ModalService } from '../../modals/modal-service';
import { ChangeEvent, SelectElement } from '../common/elements/select';
import './workspace-selector.css';

export class WorkspaceSelector extends HTMLElement {
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  modalService = dependencies.resolve<ModalService>('ModalService');

  connectedCallback() {
    this.workspaceModel.subscribe(this.update.bind(this));
    this.update();
  }

  handleWorkspaceSelect(e: ChangeEvent) {
    const newId = e.value;
    if (newId === '+') {
      this.workspaceModel.create();
    } else if (newId === '-') {
      const target = e.target as SelectElement;
      const prevSelection = target.value;
      this.modalService.open('workspace-settings');
      // e.target.value =
    } else if (newId && newId !== this.workspaceModel.activeWorkspaceId) {
      this.workspaceModel.activate(newId);
    }
  }

  update() {
    const workspaces = this.workspaceModel.all();
    const activeWorkspaceId =
      this.workspaceModel.activeWorkspaceId || (workspaces[0]?.id ?? '');

    const workspaceOptions = [
      ...workspaces.map((ws) => ({ value: ws.id, label: ws.title })),
      { type: 'separator' },
      { value: '-', label: 'Edit workspace...' },
      { value: '+', label: 'New workspace...' },
    ];

    const template = html`
      <un-select
        usenativemenu
        variant="ghost"
        .value=${activeWorkspaceId}
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
