import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  interactions,
  Resource,
  DataOutput,
  Interaction,
  TextOutput,
  workspaces,
} from '@unternet/kernel';
import { resolveMarkdown } from 'lit-markdown';
import './thread-view.css';
import { resources } from '@unternet/kernel';
import './applet-view';
import { WebOutput } from '@unternet/kernel/core/interactions';
import { repeat } from 'lit/directives/repeat.js';
import { config } from '../features/config';
import { Tab, tabs } from '../features/tabs';
import { Subscription } from 'dexie';

@customElement('thread-view')
export class ThreadView extends LitElement {
  renderRoot = this;

  interactionSubscription: Subscription;

  @property({ attribute: false })
  resources: Resource[] = [];

  @property({ attribute: false })
  tab: Interaction[] = [];

  @property({ attribute: false })
  interactions: Interaction[] = [];

  connectedCallback() {
    super.connectedCallback();
    config.subscribeToKey('activeTab', this.updateTab.bind(this));

    resources.subscribe(
      resources.all,
      (resources) => (this.resources = resources)
    );
  }

  async updateTab(tabId: Tab['id']) {
    const workspaceId = await tabs.getWorkspaceId(tabId);
    this.interactionSubscription?.unsubscribe();
    this.interactionSubscription = await workspaces.subscribeToInteractions(
      workspaceId,
      (interactions) => (this.interactions = interactions)
    );
  }

  updateInteractions(newInteractions: Interaction[]) {
    this.interactions = newInteractions;
  }

  updated(changedProperties) {
    super.updated(changedProperties);
  }

  textOutputTemplate(output: TextOutput) {
    return html`<div class="block">${resolveMarkdown(output.content)}</div>`;
  }

  dataOutputTemplate(output: DataOutput) {
    const resource = this.resources.find(
      (resource) => resource.url === output.resourceUrl
    );

    if (!resource) return;
    return html`<div class="data-output">
      ${resource.icons && resource.icons.length
        ? html`<img class="applet-icon" src=${resource.icons[0].src} />`
        : ''}
      <div class="description">
        Searched using
        <span class="applet-name">${resource.short_name || resource.name}</span>
      </div>
    </div>`;
  }

  appletOutputTemplate(output: WebOutput) {
    return html`<div class="applet-output">
      <applet-view processId=${output.processId}></applet-view>
    </div>`;
  }

  loadingTemplate() {
    return html` <div class="loading">Thinking...</div> `;
  }

  interactionTemplate(interaction: Interaction) {
    return html`
      <div class="interaction">
        <div class="page">
          <div class="interaction-input">${interaction.input.text}</div>
          ${!interaction.outputs.length ? this.loadingTemplate() : ''}
          ${interaction.outputs.map((output) =>
            output.type === 'text'
              ? this.textOutputTemplate(output)
              : output.type === 'web'
              ? this.appletOutputTemplate(output)
              : this.dataOutputTemplate(output)
          )}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.interactions.length) {
      return html`<div class="splash-screen"></div>`;
    }
    return html`${repeat(
      this.interactions,
      (interaction) => interaction.id,
      (interaction) => this.interactionTemplate(interaction)
    )}`;
  }
}
