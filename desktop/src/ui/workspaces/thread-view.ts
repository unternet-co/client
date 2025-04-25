import { html, render } from 'lit';
import { Workspace, WorkspaceModel } from '../../workspaces';
import { Message } from '../../messages';
import { dependencies } from '../../common/dependencies';
import '../common/elements/scroll-container';
import '../common/elements/markdown-text';
import './thread-view.css';
import './process-frame';
import { repeat } from 'lit/directives/repeat.js';
import { ResourceModel } from '../../protocols/resources';
import './process-view';
import { ActionMessage, InputMessage, ResponseMessage } from '@unternet/kernel';
import { Kernel, KernelStatus } from '../../ai/kernel';
import { getResourceIcon } from '../../common/utils';

class ThreadView extends HTMLElement {
  private workspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private messages: Message[] = [];
  private status: KernelStatus;
  private resourceModel = dependencies.resolve<ResourceModel>('ResourceModel');
  private kernel = dependencies.resolve<Kernel>('Kernel');
  private workspaceId: Workspace['id'];

  static get observedAttributes() {
    return ['for'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'for' && oldValue !== newValue) {
      this.workspaceId = newValue;
      this.updateMessages();
    }
  }

  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';

    this.kernel.subscribe((notification) => {
      if (notification.status) this.updateKernelStatus(notification.status);
    });
    this.updateKernelStatus(this.kernel.status);

    this.updateMessages();
    this.workspaceModel.subscribeToWorkspace(
      this.workspaceId,
      this.updateMessages.bind(this)
    );
  }

  updateMessages() {
    this.messages = Array.from(
      this.workspaceModel.allMessages(this.workspaceId)
    );
    this.render();
  }

  updateKernelStatus(status: KernelStatus) {
    this.status = status;
    this.render();
  }

  render() {
    const messagesTemplate = repeat(
      this.messages,
      (message) => message.id,
      this.messageTemplate.bind(this)
    );

    const template = html`
      <message-scroll class="inner">
        ${messagesTemplate} ${this.loadingTemplate()}
      </message-scroll>
    `;

    render(template, this);
  }

  loadingTemplate() {
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
    const resource = this.resourceModel.find(message.uri);

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
