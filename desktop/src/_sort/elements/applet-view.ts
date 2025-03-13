import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Process, processes, Resource, resources } from '@unternet/kernel';
import '@web-applets/sdk/dist/elements/applet-frame';
import './applet-view.css';

@customElement('applet-view')
export class AppletView extends LitElement {
  renderRoot = this;

  @property({ type: Number })
  processId: number;

  @property({ type: String })
  src: string = '';

  @property({ attribute: false })
  resource: Resource;

  @property({ attribute: false })
  data: any;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadResource();
  }

  async loadResource() {
    this.resource = (await resources.get(this.src)) as Resource;
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('src') && !this.resource) this.loadResource();
    if (changedProperties.has('processId') && this.processId)
      this.attachProcess(this.processId);
  }

  attachProcess(processId: Process['id']) {
    const query = () => processes.get(processId);
    processes.subscribe(query, (process: Process) => {
      this.src = process.url;
      this.data = process.data;
    });
  }

  render() {
    if (!this.src) return;
    return html`
      <header class="applet-header">
        <img src=${this.resource?.icons && this.resource.icons[0].src} />${this
          .resource?.name}
      </header>
      <applet-frame src=${this.src} .data=${this.data}></applet-frame>
    `;
  }
}
