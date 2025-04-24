import { CommandSubmitEvent } from './command-input';
import './command-bar.css';
import './command-input';
import './thread-view';
import './workspace-view.css';
import './resource-bar';
import { html, render } from 'lit';
import { Workspace, WorkspaceModel } from '../../workspaces';
import { Kernel, KernelNotInitializedError } from '../../ai/kernel';
import { dependencies } from '../../common/dependencies';
import { ModalService } from '../../modals/modal-service';

export class WorkspaceView extends HTMLElement {
  workspaceId: Workspace['id'];
  kernel = dependencies.resolve<Kernel>('Kernel');
  static observedAttributes = ['for'];
  private visibilityObserver: IntersectionObserver;

  // TODO: Implement dependency injection with decorators
  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';
    render(this.template, this);

    // Autofocus the command input after rendering
    setTimeout(() => this.focusCommandInput(), 0);

    // Set up visibility observer to focus when tab is switched back to this view
    this.setupVisibilityObserver();
  }

  disconnectedCallback() {
    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
    }
  }

  private focusCommandInput() {
    const commandInput = this.querySelector('command-input');
    if (commandInput) {
      (commandInput as any).focus();
    }
  }

  private setupVisibilityObserver() {
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          this.focusCommandInput();
        }
      },
      { threshold: [0.5] }
    );

    this.visibilityObserver.observe(this);
  }

  async handleCommandSubmit(e: CommandSubmitEvent) {
    try {
      await this.kernel.handleInput(this.workspaceId, e.input);
    } catch (error) {
      console.error('Error handling command input:', error);

      if (error instanceof KernelNotInitializedError) {
        const modalService = dependencies.resolve<ModalService>('ModalService');
        modalService.open('settings');
      }
    }
  }

  get template() {
    return html`
      <div class="workspace-content">
        <thread-view for=${this.workspaceId}></thread-view>
      </div>
      <div class="bottom-bar">
        <command-bar>
          <command-input
            @submit=${(e) => this.handleCommandSubmit(e)}
          ></command-input>
        </command-bar>
        <resource-bar for=${this.workspaceId}></resource-bar>
      </div>
    `;
  }
}

customElements.define('workspace-view', WorkspaceView);
