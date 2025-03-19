import { html, render, TemplateResult } from 'lit';
import { Interaction, InteractionOutput } from '../../models/interaction';
import { Workspace, workspaceModel } from '../../models/workspaces';
import './interaction-history.css';

class InteractionHistory extends HTMLElement {
  workspaceId: Workspace['id'];

  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';
    this.updateInteractions();
    workspaceModel.subscribeToWorkspace(this.workspaceId, () =>
      this.updateInteractions()
    );
  }

  updateInteractions() {
    const interactions = workspaceModel.getInteractions(this.workspaceId);

    const template = (interaction: Interaction) => html`
      <div class="interaction">
        <div class="interaction-input">${interaction.input.text}</div>
        ${interaction.outputs.map((output) => this.outputTemplate(output))}
      </div>
    `;

    render(interactions.map(template), this);
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
