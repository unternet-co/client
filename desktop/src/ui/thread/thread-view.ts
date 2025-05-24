import { html, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { DisposableGroup } from '../../common/disposable';
import { createEl } from '../../common/utils';
import {
  WorkspaceService,
  WorkspaceServiceNotification,
} from '../../workspaces/workspace-service';
import { KernelMessage, ResponseMessage } from '@unternet/kernel';
import './thread-view.css';
import {
  WorkspaceModel,
  WorkspaceModelNotification,
} from '../../workspaces/workspace-model';
import { WorkspaceRecord } from '../../workspaces/types';
import { Message } from '../../messages/types';

class ThreadView extends HTMLElement {
  private workspaceService =
    dependencies.resolve<WorkspaceService>('WorkspaceService');
  private workspaceDisposables = new DisposableGroup();
  private messageOverlayEl: HTMLDivElement;
  private workspaceModel: WorkspaceModel | null = null;
  private loadingIndicatorEl: HTMLElement;
  private lastInputMessageId: Message['id'] | null = null;

  static get observedAttributes() {
    return ['for'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (this.isConnected && name === 'for' && oldValue !== newValue) {
      this.updateWorkspace();
    }
  }

  updateWorkspace() {
    this.workspaceDisposables.dispose();
    this.workspaceModel = this.workspaceService.activeWorkspaceModel;

    this.workspaceDisposables.add(
      this.workspaceModel.subscribe(
        (notification: WorkspaceModelNotification) => {
          if (notification.type === 'add-message') {
            this.addMessage(notification.message);
          } else if (notification.type === 'update-message') {
            this.updateMessage(notification.message);
          }
        }
      )
    );

    this.firstRender();
  }

  connectedCallback() {
    const workspaceId = this.getAttribute('for');
    if (workspaceId) {
      this.updateWorkspace();
    } else {
      this.firstRender();
    }
  }

  firstRender() {
    this.messageOverlayEl = createEl<HTMLDivElement>('div', {
      className: 'message-overlay',
    });

    // Create loading indicator container
    this.loadingIndicatorEl = createEl<HTMLDivElement>('div', {
      className: 'loading-indicator',
    });

    // Add loading icon and text
    const loadingIcon = document.createElement('un-icon');
    loadingIcon.setAttribute('name', 'loading');
    loadingIcon.setAttribute('spin', '');

    // Add message text
    const loadingText = createEl<HTMLDivElement>('div', {
      className: 'loading-text',
    });
    loadingText.textContent = 'Thinking...';

    // Add icon and text to the indicator
    this.loadingIndicatorEl.appendChild(loadingIcon);
    this.loadingIndicatorEl.appendChild(loadingText);

    // Hide loading indicator initially
    this.loadingIndicatorEl.style.display = 'none';

    // Render both elements to the DOM
    render(html`${this.loadingIndicatorEl}${this.messageOverlayEl}`, this);
  }

  createMessageElement(message: KernelMessage): HTMLElement {
    const messageEl = createEl<HTMLDivElement>('div', {
      className: 'message',
      dataset: {
        id: message.id,
        type: message.type,
      },
    });

    if (message.type === 'response') {
      const responseMsg = message as ResponseMessage;
      // Only show messages with actual content
      if (responseMsg.text && responseMsg.text.trim()) {
        messageEl.innerHTML = responseMsg.text;
      }
    }

    return messageEl;
  }

  addMessage(message: Message) {
    // Track input messages to know what responses to show
    if (message.type === 'input') {
      this.lastInputMessageId = message.id;
      this.messageOverlayEl.innerHTML = '';
      this.showLoadingIndicator();
    }

    // If this is a response message and we've seen an input message before it
    else if (message.type === 'response' && this.lastInputMessageId) {
      // Only add response to the overlay if it has content
      const responseMsg = message as ResponseMessage;
      if (responseMsg.text && responseMsg.text.trim()) {
        // Hide the loading indicator when we get a response with content
        this.hideLoadingIndicator();

        // Clear previous messages only when we have non-empty content in a new response
        if (this.messageOverlayEl.children.length === 0) {
          // The first response after input with content will clear the overlay
          this.messageOverlayEl.innerHTML = '';
        }

        // Create and add the message element
        const messageEl = this.createMessageElement(message);
        this.messageOverlayEl.appendChild(messageEl);
      }
    }
  }

  updateMessage(message: Message) {
    // Update an existing response message
    if (message.type === 'response') {
      const responseMsg = message as ResponseMessage;
      const existingEl = this.querySelector(`[data-id="${message.id}"]`);

      if (responseMsg.text && responseMsg.text.trim()) {
        // Hide loading indicator when we get a response with content
        this.hideLoadingIndicator();

        // If we have content and the element exists, update it
        if (existingEl) {
          const newEl = this.createMessageElement(message);
          existingEl.replaceWith(newEl);
        }
        // If we have content but no element exists yet, create it
        else {
          // If this is the first content, clear old messages
          if (this.messageOverlayEl.children.length === 0) {
            this.messageOverlayEl.innerHTML = '';
          }

          const messageEl = this.createMessageElement(message);
          this.messageOverlayEl.appendChild(messageEl);
        }
      }
    }
  }

  // Show the loading indicator
  showLoadingIndicator() {
    if (this.loadingIndicatorEl) {
      this.loadingIndicatorEl.style.display = 'flex';
    }
  }

  // Hide the loading indicator
  hideLoadingIndicator() {
    if (this.loadingIndicatorEl) {
      this.loadingIndicatorEl.style.display = 'none';
    }
  }

  disconnectedCallback() {
    this.workspaceDisposables.dispose();
  }
}

customElements.define('thread-view', ThreadView);
