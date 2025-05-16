import { html, render } from 'lit';
import { dependencies } from '../../../common/dependencies';

export const workspaceSectionDef = {
  key: 'workspace',
  label: 'Workspace',
  render: () => html`<workspace-section></workspace-section>`,
};

export class WorkspaceSection extends HTMLElement {
  #workspaceModel: any;
  #modalService: any;
  #workspace: any;
  #newWorkspaceName: string;

  constructor() {
    super();
    this.#workspaceModel = null;
    this.#modalService = null;
    this.#workspace = null;
    this.#newWorkspaceName = '';
  }

  connectedCallback() {
    this.#workspaceModel = dependencies.resolve<any>('WorkspaceModel');
    this.#modalService = dependencies.resolve<any>('ModalService');
    if (this.#workspaceModel) {
      const id = this.#workspaceModel.activeWorkspaceId;
      this.#workspace = this.#workspaceModel.get(id);
      this.#newWorkspaceName = this.#workspace?.title || '';
    }
    this.render();
    setTimeout(() => {
      const firstInput = this.querySelector(
        'input, textarea, select, un-textarea'
      );
      if (firstInput) (firstInput as HTMLElement).focus();
    }, 0);
  }

  #handleNameChange = (event: InputEvent) => {
    const newName = (event.target as HTMLInputElement).value;
    this.#newWorkspaceName = newName;
    if (
      newName.trim() &&
      this.#workspace &&
      newName !== this.#workspace.title
    ) {
      this.#workspaceModel.setTitle(newName.trim());
    }
    this.render();
  };

  #handleDelete = () => {
    if (!this.#workspace) return;
    const wsTitle = this.#workspace.title;
    const wsId = this.#workspace.id;
    this.#modalService.open('workspace-delete', {
      'workspace-id': wsId,
      'workspace-title': wsTitle,
    });
  };

  render() {
    render(
      html`
        <form>
          <h3>Current Workspace</h3>
          <fieldset>These settings apply to the current workspace.</fieldset>
          <fieldset>
            <un-label for="ws-name">Workspace Name</un-label>
            <un-input
              id="ws-name"
              autofocus
              .value=${this.#newWorkspaceName}
              @change=${this.#handleNameChange}
            ></un-input>
          </fieldset>
          <fieldset>
            <un-button
              variant="negative"
              icon="delete"
              @click=${this.#handleDelete}
              >Delete Workspace</un-button
            >
          </fieldset>
        </form>
      `,
      this
    );
  }
}

customElements.define('workspace-section', WorkspaceSection);
