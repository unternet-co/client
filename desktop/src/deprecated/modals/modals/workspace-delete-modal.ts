import { html, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { ModalService } from '../../deprecated/modals/modal-service';
import { WorkspaceModel } from '../../deprecated/workspace-service';
import {
  ModalElement,
  ModalOptions,
} from '../../deprecated/modals/modal-element';

export class WorkspaceDeleteModal extends ModalElement {
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
    this.addEventListener('modal-open', this.#handleOpen);
  }

  disconnectedCallback() {
    this.removeEventListener('modal-open', this.#handleOpen);
  }

  #handleOpen = (e: CustomEvent) => {
    const { options } = e.detail || {};
    if (options['workspace-id']) {
      this.workspaceId = options['workspace-id'];
    }
    if (options['workspace-title']) {
      this.workspaceTitle = options['workspace-title'];
    }
    this.render();
  };

  #handleCancel = () => {
    this.close();
  };

  #handleDelete = () => {
    this.#workspaceModel.delete(this.workspaceId);
    this.close();
    this.#modalService.close('settings');
  };

  render() {
    const template = html`
      <div>
        <p>
          Are you sure you want to delete
          <strong>${this.workspaceTitle}</strong>? This action cannot be undone.
        </p>
        <footer>
          <un-button variant="secondary" @click=${this.#handleCancel}>
            Cancel
          </un-button>
          <un-button variant="negative" @click=${this.#handleDelete}>
            Delete
          </un-button>
        </footer>
      </div>
    `;

    render(template, this);
  }
}

customElements.define('workspace-delete-modal', WorkspaceDeleteModal);
