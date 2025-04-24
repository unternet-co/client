import { html, render } from 'lit';
import { Workspace, WorkspaceModel } from '../../workspaces';
import { dependencies } from '../../common/dependencies';
import '../common/scroll-container';
import '../common/markdown-text';
import './thread-view.css';
import { repeat } from 'lit/directives/repeat.js';
import { ResourceModel } from '../../protocols/resources';
import './process-view';
import { MessageRecord } from '../../messages';
import { ActionMessage, InputMessage, ResponseMessage } from '@unternet/kernel';

class ThreadView extends HTMLElement {
  private workspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private resourceModel = dependencies.resolve<ResourceModel>('ResourceModel');
  private workspaceId: Workspace['id'];

  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';
    this.updateMessages();
    this.workspaceModel.subscribeToWorkspace(
      this.workspaceId,
      this.updateMessages.bind(this)
    );
  }

  updateMessages() {
    const messages = this.workspaceModel.allMessages(this.workspaceId);
    this.render(messages);
  }

  render(messages: MessageRecord[]) {
    console.log('UPDAYTING');
    const messagesTemplate = repeat(
      messages,
      (message) => message.id,
      this.messageTemplate.bind(this)
    );

    const template = html`
      <message-scroll class="inner">
        <div class="message-list">${messagesTemplate}</div>
      </message-scroll>
    `;

    render(template, this);
  }

  messageTemplate(message: MessageRecord) {
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
    return html` <div class="message" data-type="input">${message.text}</div> `;
  }

  responseMessageTemplate(message: ResponseMessage) {
    return html`<div class="message" data-type="response">
      <markdown-text>${message.text}</markdown-text>
    </div>`;
  }

  actionMessageTemplate(message: ActionMessage) {
    const resource = this.resourceModel.find(message.directive.uri);

    let icon = html``;
    if (resource.icons && resource.icons[0] && resource.icons[0].src) {
      icon = html`<img src=${resource.icons[0].src} class="resource-icon" />`;
    }
    return html`<div class="message" data-type="action">
      ${icon}
      <span class="notification-text">Used ${resource.name}</span>
    </div>`;
  }

  processMessageTemplate(message: ActionMessage) {
    return html`
      <div class="message" data-type="process">
        <process-view .process=${message.process}></process-view>
      </div>
    `;
  }
}

customElements.define('thread-view', ThreadView);
