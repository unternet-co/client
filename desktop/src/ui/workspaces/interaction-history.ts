import { html, render, TemplateResult } from 'lit';
import { Interaction, InteractionOutput } from '../../models/interactions';
import './interaction-history.css';
import { appendEl, createEl } from '../../utils/dom';
import { Workspace, WorkspaceModel } from '../../models/workspaces';
import { dependencies } from '../../base/dependencies';

class InteractionHistory extends HTMLElement {
  workspaceModel: WorkspaceModel;
  workspaceId: Workspace['id'];
  interactionsContainer: HTMLElement;

  constructor() {
    super();
    this.workspaceModel = dependencies.resolve('WorkspaceModel');
  }

  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';

    this.interactionsContainer = appendEl(
      this,
      createEl('div', { className: 'inner' })
    );
    this.updateInteractions();
    this.workspaceModel.subscribeToWorkspace(this.workspaceId, () =>
      this.updateInteractions()
    );
  }

  updateInteractions() {
    const interactions = this.workspaceModel.getInteractions(this.workspaceId);

    const template = (interaction: Interaction) => html`
      <div class="interaction">
        <div class="interaction-input">${interaction.input.text}</div>
        ${interaction.outputs.map((output) => this.outputTemplate(output))}
      </div>
    `;

    render(interactions.map(template), this.interactionsContainer);
  }

  outputTemplate(output: InteractionOutput) {
    let template: TemplateResult = html``;
    if (output.type === 'text') {
      template = html`${output.content}`;
    }
    return html`<div class="interaction-output">${template}</div>`;
  }
}

customElements.define('interaction-history', InteractionHistory);
