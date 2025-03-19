import { html, render, TemplateResult } from 'lit';
import { Interaction, InteractionOutput, Workspace } from '../../data-types';
import { workspaceStore } from '../../stores/workspace-store';
import './interaction-history.css';

class InteractionHistory extends HTMLElement {
  workspaceId: Workspace['id'];

  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';
    this.updateInteractions();
    workspaceStore.subscribeToWorkspace(this.workspaceId, () =>
      this.updateInteractions()
    );
  }

  updateInteractions() {
    const interactions = workspaceStore.getInteractions(this.workspaceId);

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
