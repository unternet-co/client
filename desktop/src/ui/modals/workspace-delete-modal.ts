import { html, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { ModalService } from '../../modals/modal-service';
import { WorkspaceModel } from '../../models/workspace-model';
import { ModalElement, ModalOptions } from '../../modals/modal-element';

export class WorkspaceDeleteModal extends ModalElement {
  static get observedAttributes() {
    return ['workspace-id', 'workspace-title'];
  }

  workspaceId = '';
  workspaceTitle = '';

  #workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  #modalService = dependencies.resolve<ModalService>('ModalService');

  constructor() {
    super({
      title: 'Delete Workspace',
      size: 'auto',
      padding: 'auto',
      blocking: true,
      position: 'center',
    } as ModalOptions);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    if (oldValue === newValue) return;
    if (name === 'workspace-id') {
      this.workspaceId = newValue || '';
    } else if (name === 'workspace-title') {
      this.workspaceTitle = newValue || '';
    }
    this.render();
  }

  #handleCancel = () => {
    this.#modalService.close('workspace-delete');
  };

  #handleDelete = () => {
    this.#workspaceModel.delete(this.workspaceId);
    this.#modalService.close('workspace-delete');
    this.#modalService.close('workspace-settings');
  };

  render() {
    const template = html`
      <div>
        <p>
          Are you sure you want to delete
          <strong>${this.workspaceTitle}</strong>? This action cannot be undone.
        </p>
        <footer>
          <un-button type="secondary" @click=${this.#handleCancel}>
            Cancel
          </un-button>
          <un-button type="negative" @click=${this.#handleDelete}>
            Delete
          </un-button>
        </footer>
      </div>
    `;

    render(template, this);
  }
}

customElements.define('workspace-delete-modal', WorkspaceDeleteModal);
