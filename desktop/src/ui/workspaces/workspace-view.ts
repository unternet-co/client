import { CommandSubmitEvent } from './command-input';
import './command-input';
import './interaction-history';
import './workspace-view.css';
import './resource-bar';
import { html, render } from 'lit';
import { Workspace, WorkspaceModel } from '../../workspaces';
import { Kernel } from '../../ai/kernel';
import { dependencies } from '../../common/dependencies';
import { ModalService } from '../../modals/modal-service';

export class WorkspaceView extends HTMLElement {
  workspaceId: Workspace['id'];
  kernel = dependencies.resolve<Kernel>('Kernel');
  static observedAttributes = ['for'];

  // TODO: Implement dependency injection with decorators
  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';
    render(this.template, this);
  }

  async handleCommandSubmit(e: CommandSubmitEvent) {
    try {
      await this.kernel.handleInput(this.workspaceId, e.input);
    } catch (error) {
      console.error('Error handling command input:', error);

      // If the error is due to kernel not being initialized, open the settings modal
      if (
        error instanceof Error &&
        error.message === 'Tried to access kernel when not initialized.'
      ) {
        const modalService = dependencies.resolve<ModalService>('ModalService');
        modalService.open('settings');

        // Show a message to the user explaining what happened
        const workspaceModel =
          dependencies.resolve<WorkspaceModel>('WorkspaceModel');
        const interaction = workspaceModel.createInteraction(
          this.workspaceId,
          e.input
        );

        workspaceModel.addOutput(interaction.id, {
          type: 'text',
          content: `⚠️ No model is configured. Please select a model in the settings.`,
        });
      }
    }
  }

  get template() {
    return html`
      <div class="workspace-content">
        <interaction-history for=${this.workspaceId}></interaction-history>
      </div>
      <div class="command-bar">
        <command-input
          @submit=${this.handleCommandSubmit.bind(this)}
        ></command-input>
      </div>
      <resource-bar for=${this.workspaceId}></resource-bar>
    `;
  }
}

customElements.define('workspace-view', WorkspaceView);
