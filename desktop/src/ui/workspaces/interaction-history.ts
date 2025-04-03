import { html, render, TemplateResult } from 'lit';
import { InteractionOutput } from '../../core/interactions';
import { appendEl, createEl } from '../../common/utils/dom';
import { Workspace, WorkspaceModel } from '../../core/workspaces';
import { dependencies } from '../../common/dependencies';
import '../common/scroll-container';
import '../common/markdown-text';
import './interaction-history.css';

class InteractionHistory extends HTMLElement {
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  workspaceId: Workspace['id'];
  interactionsContainer: HTMLElement;
  private thinkingIndicator: HTMLDivElement | null = null;
  private thinkingAnimationInterval: number | null = null;
  private isThinking = false;
  private lastInteractionCount = 0;

  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';

    this.interactionsContainer = appendEl(
      this,
      createEl('message-scroll', { className: 'inner' })
    );
    this.updateInteractions();
    this.workspaceModel.subscribeToWorkspace(this.workspaceId, () => {
      this.handleWorkspaceNotification();
      this.updateInteractions();
    });

    // Initialize the last interaction count
    this.lastInteractionCount = this.workspaceModel.allInteractions(
      this.workspaceId
    ).length;
  }

  handleWorkspaceNotification() {
    const interactions = this.workspaceModel.allInteractions(this.workspaceId);
    const currentInteractionCount = interactions.length;
    // If a new interaction was added, start the thinking animation
    if (currentInteractionCount > this.lastInteractionCount) {
      this.startThinkingAnimation();
      this.lastInteractionCount = currentInteractionCount;
    }
    // If the last interaction has outputs, stop the thinking animation
    else if (currentInteractionCount > 0) {
      const lastInteraction = interactions[interactions.length - 1];
      if (
        lastInteraction &&
        lastInteraction.outputs &&
        lastInteraction.outputs.length > 0
      ) {
        this.stopThinkingAnimation();
      }
    }
  }

  startThinkingAnimation() {
    if (this.isThinking) return;

    // Create the thinking indicator if it doesn't exist
    if (!this.thinkingIndicator) {
      this.thinkingIndicator = document.createElement('div');
      this.thinkingIndicator.className =
        'thinking-indicator interaction-output';

      // Create a new interaction div to hold our thinking indicator
      const interactionDiv = document.createElement('div');
      interactionDiv.className = 'interaction';
      interactionDiv.appendChild(this.thinkingIndicator);
      // Add it to the interaction history at the beginning (newest position)
      if (this.interactionsContainer) {
        // Insert at the beginning of the container (newest position)
        if (this.interactionsContainer.firstChild) {
          this.interactionsContainer.insertBefore(
            interactionDiv,
            this.interactionsContainer.firstChild
          );
        } else {
          this.interactionsContainer.appendChild(interactionDiv);
        }
      }
    }

    this.isThinking = true;

    const text = 'thinking...';
    let currentLetterIndex = 0;

    // Initialize the text with all letters with base styling
    this.updateThinkingText(text, currentLetterIndex);

    // Start animation interval
    this.thinkingAnimationInterval = window.setInterval(() => {
      // Move to the next letter
      currentLetterIndex = (currentLetterIndex + 1) % text.length;
      // Update the thinking text with the new active letter
      this.updateThinkingText(text, currentLetterIndex);
    }, 200);
  }

  stopThinkingAnimation() {
    if (!this.isThinking) return;
    this.isThinking = false;
    if (this.thinkingAnimationInterval !== null) {
      clearInterval(this.thinkingAnimationInterval);
      this.thinkingAnimationInterval = null;
    }
    if (this.thinkingIndicator) {
      // Remove the entire interaction div containing the thinking indicator
      const parentInteraction = this.thinkingIndicator.parentElement;
      if (parentInteraction) {
        parentInteraction.remove();
      }
      this.thinkingIndicator = null;
    }
  }

  updateThinkingText(text: string, activeIndex: number) {
    if (!this.thinkingIndicator) return;

    let html = '';
    for (let i = 0; i < text.length; i++) {
      const className =
        i === activeIndex ? 'thinking-letter active' : 'thinking-letter';
      html += `<span class="${className}">${text[i]}</span>`;
    }

    this.thinkingIndicator.innerHTML = html;
  }

  updateInteractions() {
    const interactions = Array.from(
      this.workspaceModel.allInteractions(this.workspaceId)
    );

    const templates: TemplateResult[] = [];

    for (let i = interactions.length - 1; i >= 0; i--) {
      templates.push(html`
        <div class="interaction">
          <div class="interaction-input">${interactions[i].input.text}</div>
          ${interactions[i].outputs.map((output) =>
            this.outputTemplate(output)
          )}
        </div>
      `);
    }

    render(templates, this.interactionsContainer);
  }

  outputTemplate(output: InteractionOutput) {
    let template: TemplateResult = html``;
    if (output.type === 'text') {
      template = html`<markdown-text>${output.content}</markdown-text>>`;
    }
    return html`<div class="interaction-output" data-format="markdown">
      ${template}
    </div>`;
  }
}

customElements.define('interaction-history', InteractionHistory);
