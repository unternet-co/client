import { html, render } from 'lit';
import { WorkspaceModel, Workspace } from '../../workspaces';
import { Message } from '../../messages';
import { dependencies } from '../../common/dependencies';
import '../common/elements/scroll-container';
import '../common/elements/markdown-text';
import './thread-view.css';
import './process-frame';
import { repeat } from 'lit/directives/repeat.js';
import pluralize from 'pluralize';
import { ResourceModel } from '../../resources';
import './process-view';
import { ActionMessage, InputMessage, ResponseMessage } from '@unternet/kernel';
import { Kernel, KernelStatus } from '../../ai/kernel';
import { getResourceIcon } from '../../common/utils';

class ThreadView extends HTMLElement {
  private workspaceSubscription: { dispose: () => void } | null = null;
  private workspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private workspace: Workspace;
  private status: KernelStatus;
  private resourceModel = dependencies.resolve<ResourceModel>('ResourceModel');
  private kernel = dependencies.resolve<Kernel>('Kernel');

  static get observedAttributes() {
    return ['for'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'for' && oldValue !== newValue) {
      this.setActiveWorkspace(newValue);
    }
  }

  connectedCallback() {
    this.kernel.subscribe((notification) => {
      if (notification.status) this.updateKernelStatus(notification.status);
    });
    this.updateKernelStatus(this.kernel.status);

    const workspaceId = this.getAttribute('for') || '';
    this.setActiveWorkspace(workspaceId);
  }

  setActiveWorkspace(workspaceId: Workspace['id']) {
    // Clean up previous subscription
    if (this.workspaceSubscription) {
      this.workspaceSubscription.dispose();
    }

    // Subscribe to new workspace
    this.workspaceSubscription = this.workspaceModel.subscribeToWorkspace(
      workspaceId,
      this.render.bind(this)
    );

    this.workspace = this.workspaceModel.get(workspaceId);
    this.render();
  }

  disconnectedCallback() {
    if (this.workspaceSubscription) {
      this.workspaceSubscription.dispose();
    }
  }

  updateKernelStatus(status: KernelStatus) {
    this.status = status;
    this.render();
  }

  handleScrollPositionChanged = (e: CustomEvent) => {
    this.workspaceModel.setScrollPosition(e.detail.scrollTop);
  };

  render() {
    if (!this.workspace) return html``;

    const messagesTemplate = (msgs: Message[]) =>
      repeat(msgs, (message) => message.id, this.messageTemplate.bind(this));

    const numArchived = Math.floor(this.workspace.inactiveMessages.length / 2);

    const activeMessagesTemplate = messagesTemplate(
      this.workspace.activeMessages
    );

    const inactiveMessagesTemplate = this.workspace.showArchived
      ? messagesTemplate(this.workspace.inactiveMessages)
      : [];

    const archivedButton = numArchived
      ? html` <div class="archived-message">
          ${numArchived} archived ${pluralize('message', numArchived)}&nbsp;
          <un-button
            type="link"
            size="small"
            @click=${this.toggleArchivedMessages}
          >
            ${this.workspace.showArchived ? 'Hide' : 'Show'}
          </un-button>
        </div>`
      : null;

    const template = html`
      <message-scroll
        class="inner"
        .scrollPosition=${this.workspace.scrollPosition}
        @scroll-position-changed=${this.handleScrollPositionChanged}
      >
        <div class="message-list">
          ${inactiveMessagesTemplate} ${archivedButton}
          ${activeMessagesTemplate} ${this.loadingTemplate}
        </div>
      </message-scroll>
    `;

    render(template, this);
  }

  toggleArchivedMessages = () => {
    const ws = this.workspaceModel.activeWorkspace;
    this.workspaceModel.setArchiveVisibility(!ws.showArchived);
    this.render();
  };

  get loadingTemplate() {
    if (this.status !== 'thinking') return null;
    return html`<un-icon name="loading" spin class="loading"></un-icon>`;
  }

  messageTemplate(message: Message) {
    if (message.type === 'input') {
      return this.inputMessageTemplate(message);
    } else if (message.type === 'response') {
      return this.responseMessageTemplate(message);
    } else if (message.type === 'action' && message.process) {
      return this.processMessageTemplate(message);
    } else if (message.type === 'action') {
      return this.actionMessageTemplate(message);
    }
  }

  inputMessageTemplate(message: InputMessage) {
    return html`<div class="message" data-type="input">${message.text}</div>`;
  }

  responseMessageTemplate(message: ResponseMessage) {
    return html`<div class="message" data-type="response">
      <markdown-text>${message.text || html`&nbsp;`}</markdown-text>
    </div>`;
  }

  actionMessageTemplate(message: ActionMessage) {
    const resource = this.resourceModel.get(message.uri);

    let icon = html``;
    const iconSrc = getResourceIcon(resource);
    if (iconSrc) {
      icon = html`<img src=${iconSrc} class="resource-icon" />`;
    }
    return html`<div class="message" data-type="action">
      ${icon}
      <span class="notification-text">Used ${resource.name}</span>
    </div>`;
  }

  processMessageTemplate(message: ActionMessage) {
    return html`
      <div class="message" data-type="process">
        <process-frame .process=${message.process}></process-frame>
      </div>
    `;
  }
}

customElements.define('thread-view', ThreadView);
