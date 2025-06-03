import {
  ActionMessage,
  InputMessage,
  KernelMessage,
  ResponseMessage,
} from '@unternet/kernel';
import { Kernel, KernelNotification, KernelStatus } from '../../ai/kernel';
import { createEl, declareEl, getResourceIcon } from '../../common/utils';
import { html, render } from 'lit';
import {
  WorkspaceModel,
  Workspace,
  WorkspaceNotification,
} from '../../models/workspace-model';
import { dependencies } from '../../common/dependencies';
import { ResourceModel } from '../../models/resource-model';
import { Disposable } from '../../common/disposable';
import '../common/scroll-container';
import '../common/markdown-text';
import './thread-view.css';
import '../processes/process-frame';
import '../processes/process-view';
import './idle-screen';
import { IdleScreenElement } from './idle-screen';

class ThreadView extends HTMLElement {
  private workspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private workspaceSub = new Disposable();
  private kernelSub = new Disposable();
  private workspace: Workspace;
  private status: KernelStatus;
  private resourceModel = dependencies.resolve<ResourceModel>('ResourceModel');
  private kernel = dependencies.resolve<Kernel>('Kernel');
  private messageContainerEl: HTMLDivElement;
  private idleScreenEl: IdleScreenElement;
  private loadingEl: HTMLElement;
  private messageListEl: HTMLDivElement;

  static get observedAttributes() {
    return ['for'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (this.isConnected && name === 'for' && oldValue !== newValue) {
      this.updateWorkspace(newValue);
    }
  }

  connectedCallback() {
    this.messageContainerEl = this.createMessageContainer();
    this.idleScreenEl = createEl('idle-screen');
    this.loadingEl = declareEl(
      html`<un-icon name="loading" spin class="loading"></un-icon>`
    );

    this.kernelSub = this.kernel.subscribe((notification) => {
      if (notification.status) this.updateLoadingStatus(notification.status);
    });
    const workspaceId = this.getAttribute('for') || '';
    this.updateWorkspace(workspaceId);
  }

  createMessageContainer() {
    return createEl<HTMLDivElement>('div', {
      className: 'message-container',
    });
  }

  updateWorkspace(workspaceId: Workspace['id']) {
    this.workspaceSub.dispose();
    this.workspaceSub = this.workspaceModel.subscribeToWorkspace(
      workspaceId,
      this.handleWorkspaceNotification.bind(this)
    );
    this.workspace = this.workspaceModel.get(workspaceId);
    this.firstRender();
  }

  handleWorkspaceNotification(notification: WorkspaceNotification) {
    if (notification.type === 'addmessage') {
      if (this.idleScreenEl.isConnected) this.idleScreenEl.remove();
      this.addMessage(notification.message);
      if (notification.message.type === 'input') {
        this.scrollTo({
          top: this.scrollHeight,
          behavior: 'smooth',
        });
      }
    } else if (notification.type === 'updatemessage') {
      this.updateMessage(notification.message);
    }
  }

  addMessage(message: KernelMessage) {
    let currentMessageContainer;

    if (message.type === 'input') {
      // Create a new message container for input messages
      currentMessageContainer = this.createMessageContainer();
      this.appendChild(currentMessageContainer);
    } else {
      // Find the last message container to add to
      const containers = this.querySelectorAll('.message-container');
      currentMessageContainer = containers[containers.length - 1];

      // If no container exists yet (shouldn't happen), create one
      if (!currentMessageContainer) {
        currentMessageContainer = this.createMessageContainer();
        this.appendChild(currentMessageContainer);
      }
    }

    const fragment = document.createDocumentFragment();
    render(this.messageTemplate(message), fragment);
    currentMessageContainer.appendChild(fragment);
  }

  updateMessage(message: KernelMessage) {
    const messageEl = this.querySelector(`[data-id="${message.id}"]`);

    const fragment = document.createDocumentFragment();
    render(this.messageTemplate(message), fragment);

    messageEl.replaceWith(...fragment.childNodes);
  }

  updateLoadingStatus(status: KernelNotification['status']) {
    if (status === 'thinking') {
      // Find the last message container
      const containers = this.querySelectorAll('.message-container');
      const lastContainer = containers[containers.length - 1];

      if (lastContainer && !this.loadingEl.isConnected) {
        lastContainer.appendChild(this.loadingEl);
      }
    } else if (this.loadingEl.isConnected) {
      this.loadingEl.remove();
    }
  }

  disconnectedCallback() {
    this.workspaceSub.dispose();
    this.kernelSub.dispose();
  }

  firstRender() {
    if (!this.workspace) return;

    // Clear everything
    this.innerHTML = '';

    // Remove loading indicator if it exists in the DOM
    if (this.loadingEl.isConnected) {
      this.loadingEl.remove();
    }

    // Add all active messages for this workspace
    for (const message of this.workspace.activeMessages) {
      this.addMessage(message);
    }
    this.appendChild(this.idleScreenEl);

    setTimeout(() => (this.scrollTop = this.scrollHeight), 0);
  }

  get loadingTemplate() {
    if (this.status !== 'thinking') return null;
    return html`<un-icon name="loading" spin class="loading"></un-icon>`;
  }

  messageTemplate(message: KernelMessage) {
    if (message.type === 'input') {
      return html`<div
        class="message"
        data-id="${message.id}"
        data-type="input"
      >
        ${message.text}
      </div>`;
    } else if (message.type === 'response') {
      return html`<div
        class="message"
        data-id="${message.id}"
        data-type="response"
      >
        <markdown-text>${message.text || html`&nbsp;`}</markdown-text>
      </div>`;
    } else if (
      message.type === 'action' &&
      message.display === 'inline' &&
      message.process
    ) {
      return html`<div
        class="message"
        data-id="${message.id}"
        data-type="process"
      >
        <process-frame .process=${message.process}></process-frame>
      </div>`;
    } else if (message.type === 'action') {
      return html`<div
        class="message"
        data-id="${message.id}"
        data-type="action"
      >
        ${this.processSnippetTemplate(message)}
      </div>`;
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

  processSnippetTemplate(message: ActionMessage) {
    let resource;
    try {
      resource = this.resourceModel.get(message.uri);
    } catch (error) {
      // Resource was removed, show a generic message
      return html`
        <un-icon name="globe" class="resource-icon"></un-icon>
        <span class="notification-text">Used a resource (now removed)</span>
      `;
    }

    let icon = html``;
    const iconSrc = getResourceIcon(resource);
    if (iconSrc) {
      icon = html`<img src=${iconSrc} class="resource-icon" />`;
    } else {
      // Fallback icon if no icon source is available
      icon = html`<un-icon name="globe" class="resource-icon"></un-icon>`;
    }
    return html`
      ${icon}
      <span class="notification-text"
        >Used ${resource.name || 'a resource'}</span
      >
    `;
  }

  processInlineTemplate(message: ActionMessage) {
    return html`
      <div class="message" data-type="process" data-id="${message.id}">
        <process-frame .process=${message.process}></process-frame>
      </div>
    `;
  }

  clearMessageContainer() {
    const scrollPosition = this.messageContainerEl.scrollTop;
    while (this.messageContainerEl.firstChild) {
      this.messageListEl.appendChild(this.messageContainerEl.firstChild);
    }
    this.messageContainerEl.scrollTop = scrollPosition;
  }
}

customElements.define('thread-view', ThreadView);
