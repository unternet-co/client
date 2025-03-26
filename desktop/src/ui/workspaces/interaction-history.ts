import { html, render, TemplateResult } from 'lit';
import { InteractionOutput } from '../../models/interactions';
import { resolveMarkdown } from 'lit-markdown';
import { appendEl, createEl } from '../../utils/dom';
import { Workspace, WorkspaceModel } from '../../models/workspaces';
import { dependencies } from '../../base/dependencies';
import '../common/scroll-container';
import './interaction-history.css';

class InteractionHistory extends HTMLElement {
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  workspaceId: Workspace['id'];
  interactionsContainer: HTMLElement;

  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';

    this.interactionsContainer = appendEl(
      this,
      createEl('message-scroll', { className: 'inner' })
    );
    this.updateInteractions();
    this.workspaceModel.subscribeToWorkspace(this.workspaceId, () =>
      this.updateInteractions()
    );
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
      template = html`${resolveMarkdown(output.content)}`;
    }
    return html`<div class="interaction-output" data-format="markdown">
      ${template}
    </div>`;
  }
}

customElements.define('interaction-history', InteractionHistory);
