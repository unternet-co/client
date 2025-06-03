import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('pdf-viewer')
export class PDFViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 350px;
      background: var(--color-bg-content);
    }

    webview {
      width: 100%;
      height: 100%;
      border: none;
    }
  `;

  private _src: string = '';

  set src(value: string) {
    this._src = value;
    this.requestUpdate();
  }

  get src(): string {
    return this._src;
  }

  render() {
    // Use Electron's built-in PDF viewer
    return html`
      <webview
        src="${this._src}"
        webpreferences="contextIsolation=yes"
        allowpopups
      ></webview>
    `;
  }
}
