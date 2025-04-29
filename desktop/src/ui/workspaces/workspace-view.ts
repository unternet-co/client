import { CommandSubmitEvent } from './command-input';
import './command-input';
import './thread-view';
import './workspace-view.css';
import './resource-bar';
import { html, render } from 'lit';
import { WorkspaceRecord, WorkspaceModel } from '../../workspaces';
import { Kernel, KernelNotInitializedError } from '../../ai/kernel';
import { dependencies } from '../../common/dependencies';
import { ModalService } from '../../modals/modal-service';

export class WorkspaceView extends HTMLElement {
  private _workspaceId: WorkspaceRecord['id'];
  private workspaceModel: WorkspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private visibilityObserver: IntersectionObserver;

  set workspaceId(id: WorkspaceRecord['id']) {
    if (this._workspaceId !== id) {
      this._workspaceId = id;
      render(this.template, this);
      setTimeout(() => this.focusCommandInput(), 0);
    }
  }
  get workspaceId() {
    return this._workspaceId;
  }
  kernel = dependencies.resolve<Kernel>('Kernel');
  static get observedAttributes() {
    return ['for'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'for' && oldValue !== newValue) {
      this.workspaceId = newValue || '';
    }
  }

  // TODO: Implement dependency injection with decorators
  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';

    // Set up visibility observer to focus when tab is switched back to this view
    this.setupVisibilityObserver();
  }

  disconnectedCallback() {
    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
    }
  }

  private focusCommandInput() {
    const commandInput = this.querySelector(
      'command-input'
    ) as HTMLInputElement;
    commandInput.focus();
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

  private handleArchive = () => {
    const ws = this.workspaceModel.get(this.workspaceId);
    if (!ws) return;
    this.workspaceModel.archiveMessages();
    this.workspaceModel.setArchiveVisibility(!ws.showArchived);
  };

  get template() {
    return html`
      <!-- <div class="workspace-toolbar">
        <un-button
          class="archive-button"
          type="ghost"
          size="small"
          icon="archive"
          @click=${this.handleArchive}
        >Archive</un-button>
      </div> -->
      <div class="workspace-content">
        <thread-view for=${this.workspaceId}></thread-view>
      </div>
      <div class="bottom-bar">
        <div class="command-bar">
          <un-button
            class="archive-button"
            type="ghost"
            icon="plus"
            @click=${this.handleArchive}
          ></un-button>
          <command-input
            @submit=${this.handleCommandSubmit.bind(this)}
          ></command-input>
        </div>
        <resource-bar for=${this.workspaceId}></resource-bar>
      </div>
    `;
  }
}

customElements.define('workspace-view', WorkspaceView);
