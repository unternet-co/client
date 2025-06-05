import { html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { dependencies } from '../../common/dependencies';
import { WorkspaceService } from '../../workspaces/workspace-service';
import './thread-sidebar.css';
import { Message } from '../../messages/types';

@customElement('thread-sidebar')
export class ThreadView extends LitElement {
  private workspaceService =
    dependencies.resolve<WorkspaceService>('WorkspaceService');
  renderRoot = this;

  @property({ type: Boolean, reflect: true })
  accessor visible: boolean = true;

  @state()
  private accessor messages: Message[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.updateWorkspaceModel();
    this.workspaceService.subscribe(() => this.updateWorkspaceModel());
  }

  private updateWorkspaceModel() {
    const workspace = this.workspaceService.activeWorkspaceModel;
    if (workspace) {
      this.updateMessages();
      workspace.onMessagesChanged(() => this.updateMessages());
    } else {
      this.messages = [];
    }
  }

  private updateMessages() {
    const workspace = this.workspaceService.activeWorkspaceModel;
    if (workspace) {
      this.messages = [...workspace.messages].reverse();
    }
  }

  messageTemplate(message: Message) {
    const getMessageContent = (msg: Message): string => {
      if ('text' in msg) return msg.text || '';
      if (msg.type === 'action') return `Action: ${msg.actionId}`;
      return '';
    };

    return html`
      <div class="message" data-type=${message.type}>
        ${getMessageContent(message)}
      </div>
    `;
  }

  render() {
    return html`
      <ul class="message-list">
        ${repeat(
          this.messages,
          (message) => message.id,
          (message) => this.messageTemplate(message)
        )}
      </ul>
    `;
  }
}
