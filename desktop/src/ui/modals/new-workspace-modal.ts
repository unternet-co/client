import { html, render, TemplateResult } from 'lit';
import { ModalElement, ModalOptions } from '../../modals/modal-element';
import { dependencies } from '../../common/dependencies';
import { WorkspaceModel } from '../../models/workspace-model';
import '../common/input';
import '../common/button';
import '../common/label';

export class NewWorkspaceModal extends ModalElement {
  #workspaceModel!: WorkspaceModel;
  #workspaceName = '';
  #saving = false;

  constructor() {
    super({
      title: 'New Workspace',
    } as ModalOptions);
    this.#workspaceModel =
      dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  }

  connectedCallback() {
    this.render();
    setTimeout(() => {
      const firstInput = this.querySelector('input');
      if (firstInput) (firstInput as HTMLElement).focus();
    }, 0);
  }

  #handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.#workspaceName = target.value;
    this.render();
  };

  #handleSave = async (e: Event) => {
    e.preventDefault();
    if (!this.#workspaceName.trim()) return;
    this.#saving = true;
    this.render();
    try {
      const ws = await this.#workspaceModel.create(this.#workspaceName.trim());
      if (ws?.id) {
        this.#workspaceModel.activate(ws.id);
      }
      this.close();
    } finally {
      this.#saving = false;
    }
  };

  private get template(): TemplateResult {
    return html`
      <form @submit=${this.#handleSave}>
        <fieldset>
          <p>
            <strong>Workspaces</strong> are places for you to focus on different
            topics or goals
            <em
              >eg. "Personal", "Work", "Summer Road Trip" or "Kitchen
              Renovation".</em
            >
            Think of them more like a room you go to, rather than a conversation
            you start.
          </p>
        </fieldset>
        <fieldset>
          <legend>Give your workspace a name</legend>
          <un-input
            id="ws-name"
            .value=${this.#workspaceName}
            @input=${this.#handleInput}
            ?disabled=${this.#saving}
            autofocus
          ></un-input>
        </fieldset>
        <footer>
          <un-button
            variant="secondary"
            @click=${this.close}
            ?disabled=${this.#saving}
            >Cancel</un-button
          >
          <un-button
            variant="primary"
            type="submit"
            .loading=${this.#saving}
            ?disabled=${!this.#workspaceName.trim() || this.#saving}
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

customElements.define('new-workspace-modal', NewWorkspaceModal);
