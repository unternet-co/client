import { html, render, TemplateResult } from 'lit';
import { ModalElement, ModalOptions } from '../../modals/modal-element';
import { dependencies } from '../../common/dependencies';
import { WorkspaceModel, Workspace } from '../../workspaces';
import { ModalService } from '../../modals/modal-service';
import '../common/elements/input';
import '../common/elements/button';
import '../common/elements/label';

export class WorkspaceSettingsModal extends ModalElement {
  #workspaceModel!: WorkspaceModel;
  #modalService!: ModalService;
  #workspace?: Workspace;
  #newName = '';
  #saving = false;

  constructor() {
    super({
      title: 'Workspace Settings',
      blocking: true,
      position: 'center',
    } as ModalOptions);
  }

  connectedCallback() {
    this.#workspaceModel =
      dependencies.resolve<WorkspaceModel>('WorkspaceModel');
    this.#modalService = dependencies.resolve<ModalService>('ModalService');
    const id = this.#workspaceModel.activeWorkspaceId!;
    this.#workspace = this.#workspaceModel.get(id);
    this.#newName = this.#workspace?.title || '';
    this.render();
  }

  #handleInput = (event: InputEvent) => {
    this.#newName = (event.target as HTMLInputElement).value;
    this.render();
  };

  #handleSave = async () => {
    if (!this.#newName.trim() || this.#saving) return;
    this.#saving = true;
    this.#workspaceModel.setTitle(this.#newName.trim());
    this.#saving = false;
    this.close();
  };

  #handleCancel = () => {
    this.close();
  };

  #handleDelete = async () => {
    if (!this.#workspace) return;
    const wsTitle = this.#workspace.title;
    const wsId = this.#workspace.id;
    setTimeout(() => {
      const modalEl = document.querySelector('workspace-delete-modal');
      if (modalEl) {
        modalEl.setAttribute('workspace-id', wsId);
        modalEl.setAttribute('workspace-title', wsTitle);
      }
    }, 0);
    this.#modalService.open('workspace-delete');
  };

  private get template(): TemplateResult {
    return html`
      <form @submit=${this.#handleSave}>
        <fieldset>
          <un-label for="ws-name">Workspace Name</un-label>
          <un-input
            id="ws-name"
            .value=${this.#newName}
            @input=${this.#handleInput}
            ?disabled=${this.#saving}
            autofocus
          ></un-input>
        </fieldset>
        <footer>
          <un-button
            type="secondary"
            @click=${this.#handleCancel}
            ?disabled=${this.#saving}
            >Cancel</un-button
          >
          <un-button
            type="primary"
            @click=${this.#handleSave}
            .loading=${this.#saving}
            ?disabled=${!this.#newName.trim() || this.#saving}
            >Save</un-button
          >
        </footer>
      </form>
      <hr />
      <un-button
        size="small"
        type="outline"
        icon="delete"
        @click=${this.#handleDelete}
        >Delete Workspace</un-button
      >
    `;
  }

  render() {
    render(this.template, this);
  }
}

customElements.define('workspace-settings-modal', WorkspaceSettingsModal);
