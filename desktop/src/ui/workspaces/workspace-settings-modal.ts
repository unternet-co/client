import { html, render, TemplateResult } from 'lit';
import { ModalElement, ModalOptions } from '../../modals/modal-element';
import { dependencies } from '../../common/dependencies';
import { WorkspaceModel, Workspace } from '../../workspaces';
import '../common/elements/input';
import '../common/elements/button';
import '../common/elements/label';

export class WorkspaceSettingsModal extends ModalElement {
  #workspaceModel!: WorkspaceModel;
  #workspace?: Workspace;
  #newName = '';
  #saving = false;

  constructor() {
    super({
      title: 'Workspace Settings',
      blocking: false,
      position: 'right',
    } as ModalOptions);
  }

  connectedCallback() {
    this.#workspaceModel =
      dependencies.resolve<WorkspaceModel>('WorkspaceModel');
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
    `;
  }

  render() {
    render(this.template, this);
  }
}

customElements.define('workspace-settings-modal', WorkspaceSettingsModal);
