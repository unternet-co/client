import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { dependencies } from '../../common/dependencies';
import { WorkspaceService } from '../../workspaces/workspace-service';
import './thread-sidebar.css';

@customElement('thread-sidebar')
export class ThreadView extends LitElement {
  renderRoot = this;

  @property({ type: Boolean, reflect: true })
  accessor visible: boolean = true;

  private workspaceService =
    dependencies.resolve<WorkspaceService>('WorkspaceService');

  @property({ type: Array })
  private accessor messages: any[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.updateMessages();
    this.workspaceService.subscribe(() => this.updateMessages());
  }

  private updateMessages() {
    const workspace = this.workspaceService.activeWorkspaceModel;
    if (workspace) {
      this.messages = [...workspace.messages].reverse();
      this.requestUpdate();
    }
  }

  render() {
    const workspace = this.workspaceService.activeWorkspaceModel;
    if (!workspace) return;

    return html`
      <ul class="message-list">
        ${this.messages.map(
          (message) => html`
            <li class="message">${JSON.stringify(message)}</li>
          `
        )}
      </ul>
    `;
  }
}
