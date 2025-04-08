import { ModalElement } from '../../modals/modal-element';
import { html, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { WorkspaceModel } from '../../core/workspaces';
import '../../ui/common/button';

export class DeleteWorkspaceModal extends ModalElement {
  private workspaceId: string;
  private workspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');

  constructor() {
    super();
    this.size = 'auto';
  }

  connectedCallback() {
    this.workspaceId = this.getAttribute('workspace-id') || '';
    this.render();
  }

  private handleDelete() {
    if (this.workspaceId) {
      this.workspaceModel.delete(this.workspaceId);
      this.dispatchEvent(new CustomEvent('close'));
    }
  }

  private handleCancel() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  private render() {
    render(
      html`
        <div class="delete-confirmation">
          <p>
            Are you sure you want to delete this workspace? This action cannot
            be undone.
          </p>
          <div class="button-container">
            <un-button type="secondary" @click=${() => this.handleCancel()}>
              Cancel
            </un-button>
            <un-button type="negative" @click=${() => this.handleDelete()}>
              Delete
            </un-button>
          </div>
        </div>
      `,
      this
    );
  }
}

customElements.define('delete-workspace-modal', DeleteWorkspaceModal);
