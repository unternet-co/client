import { html, css, LitElement } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { dependencies } from '../../common/dependencies';
import { DisposableGroup } from '../../common/disposable';
import { WorkspaceService } from '../../workspaces/workspace-service';
import { KernelMessage } from '@unternet/kernel';
import './thread-overlay.css';
import {
  WorkspaceModel,
  WorkspaceModelNotification,
} from '../../workspaces/workspace-model';
import {
  Message,
  ResponseMessage,
  ThoughtMessage,
  LogMessage,
  InputMessage,
} from '../../messages/types';
import { Kernel, KernelNotification } from '../../kernel/kernel';
import markdownit from 'markdown-it';
const md = markdownit();

@customElement('thread-overlay')
export class ThreadView extends LitElement {
  renderRoot = this;
  private workspaceService =
    dependencies.resolve<WorkspaceService>('WorkspaceService');
  private kernel = dependencies.resolve<Kernel>('Kernel');
  private workspaceDisposables = new DisposableGroup();
  private workspaceModel: WorkspaceModel | null = null;

  @state()
  private accessor isLoading = false;

  @state()
  private accessor lastInputMessageId: Message['id'] | null = null;

  @state()
  private accessor latestMessage: Message | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.updateWorkspace();
  }

  updateWorkspace() {
    this.workspaceDisposables.dispose();
    this.workspaceModel = this.workspaceService.activeWorkspaceModel;

    // Subscribe to workspace model notifications
    this.workspaceDisposables.add(
      this.workspaceModel.subscribe(
        (notification: WorkspaceModelNotification) => {
          if (notification.type === 'add-message') {
            // Handle new messages
            const message = notification.message;
            if (message.type === 'input') {
              this.lastInputMessageId = message.id;
              this.latestMessage = null; // Clear any previous message content
            } else if (message.type !== 'action') {
              // For non-action messages, update the latest message
              this.latestMessage = message;
            }
          } else if (notification.type === 'update-message') {
            // Handle updated messages
            const message = notification.message;
            if (message.type !== 'action') {
              this.latestMessage = message;
            }
          }
        }
      )
    );

    // Subscribe to kernel status changes
    this.workspaceDisposables.add(
      this.kernel.subscribe((notification: KernelNotification) => {
        this.isLoading = notification.status === 'thinking';
      })
    );
  }

  renderMessageContent(message: Message) {
    if (!message) return '';

    if (message.type === 'response') {
      const responseMsg = message as ResponseMessage;
      if (responseMsg.text && responseMsg.text.trim()) {
        return html`<div
          class="message-content"
          data-type="${message.type}"
          data-format="markdown"
          .innerHTML=${md.render(responseMsg.text)}
        ></div>`;
      }
    } else if (message.type === 'thought') {
      const thoughtMsg = message as ThoughtMessage;
      if (thoughtMsg.text && thoughtMsg.text.trim()) {
        return html`<div class="message-content" data-type="${message.type}">
          ${thoughtMsg.text}
        </div>`;
      }
    } else if (message.type === 'log') {
      const logMsg = message as LogMessage;
      if (logMsg.text && logMsg.text.trim()) {
        return html`<div class="message-content" data-type="${message.type}">
          ${logMsg.text}
        </div>`;
      }
    }

    return '';
  }

  renderLoadingIndicator() {
    return html`
      <div class="message-overlay">
        <div class="loading-indicator">
          <un-icon .icon=${'loading'} .spin=${true}></un-icon>
          <div class="loading-text">Thinking...</div>
        </div>
      </div>
    `;
  }

  render() {
    const shouldShowLoading = this.isLoading && this.lastInputMessageId;
    if (
      !shouldShowLoading &&
      (this.latestMessage.type === 'action' ||
        this.latestMessage.type === 'log')
    )
      return;
    const shouldShowMessage = !shouldShowLoading && this.latestMessage;

    return html`
      ${shouldShowLoading ? this.renderLoadingIndicator() : ''}
      ${shouldShowMessage
        ? html`<div class="message-overlay">
            <div
              class="message"
              data-id="${this.latestMessage.id}"
              data-type="${this.latestMessage.type}"
            >
              ${this.renderMessageContent(this.latestMessage)}
            </div>
          </div>`
        : ''}
    `;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.workspaceDisposables.dispose();
  }
}
