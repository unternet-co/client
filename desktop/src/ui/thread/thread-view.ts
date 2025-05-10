import {
  ActionMessage,
  InputMessage,
  KernelMessage,
  ResponseMessage,
} from '@unternet/kernel';
import { Kernel, KernelStatus } from '../../ai/kernel';
import { createEl, getResourceIcon } from '../../common/utils';
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
  private messageListEl: HTMLDivElement;

  static get observedAttributes() {
    return ['for'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (this.isConnected && name === 'for' && oldValue !== newValue) {
      console.log(newValue);
      this.updateWorkspace(newValue);
    }
  }

  connectedCallback() {
    this.messageContainerEl = this.createMessageContainer();
    this.idleScreenEl = createEl('idle-screen');

    this.kernelSub = this.kernel.subscribe((notification) => {
      // if (notification.status) this.updateKernelStatus(notification.status);
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
    if (!this.messageContainerEl.isConnected) {
      this.appendChild(this.messageContainerEl);
    }

    if (message.type === 'input') {
      this.messageContainerEl = this.createMessageContainer();
      this.appendChild(this.messageContainerEl);
    }

    const fragment = document.createDocumentFragment();
    render(this.messageTemplate(message), fragment);
    this.messageContainerEl.appendChild(fragment);
  }

  updateMessage(message: KernelMessage) {
    const messageEl = this.querySelector(`[data-id="${message.id}"]`);

    const fragment = document.createDocumentFragment();
    render(this.messageTemplate(message), fragment);

    messageEl.replaceWith(...fragment.childNodes);
  }

  disconnectedCallback() {
    this.workspaceSub.dispose();
    this.kernelSub.dispose();
  }

  firstRender() {
    if (!this.workspace) return;
    this.innerHTML = '';

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
    console.log(message);
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
    } else if (message.type === 'action' && message.display === 'inline') {
      return html`<div
        class="message"
        data-id="${message.id}"
        data-type="process"
      >
        <process-frame .process=${message.process}></process-frame>
      </div>`;
    } else if (message.type === 'action' && message.display === 'snippet') {
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
    const resource = this.resourceModel.get(message.uri);

    let icon = html``;
    const iconSrc = getResourceIcon(resource);
    if (iconSrc) {
      icon = html`<img src=${iconSrc} class="resource-icon" />`;
    }
    return html`
      ${icon}
      <span class="notification-text">Used ${resource.name}</span>
    `;
  }

  processInlineTemplate(message: ActionMessage) {
    return html`
      <div class="message" data-type="process">
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
