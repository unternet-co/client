import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';

export class MarkdownText extends LitElement {
  static properties = {
    content: { type: String },
  };

  content = '';
  private _renderedContent = '';
  private _mutationObserver?: MutationObserver;

  static styles = css`
    :host {
      display: block;
      max-width: 65ch;
      line-height: 1.5;
    }

    *:focus {
      outline-color: var(--color-action-500);
      outline-offset: var(--outline-offset);
      outline-width: 1px;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: var(--space-8);
      margin-bottom: var(--space-4);
      line-height: 1.3;
      font-weight: 600;
    }

    p,
    ul,
    ol,
    blockquote {
      margin-bottom: 1.5em;
    }

    ul,
    ol {
      padding-left: 1.5em;
    }

    li {
      margin-bottom: 0.5em;
    }

    a {
      text-underline-offset: 0.2em;
      color: var(--color-action-800);
    }

    blockquote {
      border-left: 2px groove var(--color-text-muted);
      padding-left: var(--space-6);
      padding-top: var(--space-3);
      padding-bottom: var(--space-3);
    }

    blockquote *:last-child {
      margin-bottom: unset;
    }

    pre {
      font-family: var(--font-mono);
      padding: var(--space-3) var(--space-4);
      background: var(--color-bg-container);
      border-radius: var(--rounded-lg);
      overflow-x: auto;
      margin-bottom: 1.5em;
    }

    pre code {
      background: none;
      padding: 0;
      color: var(--color-text-default);
    }

    code {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      padding: var(--space-1) var(--space-2);
      background: var(--color-neutral-15);
      border-radius: var(--rounded);
    }

    hr {
      border: none;
      border-top: 1px solid var(--color-border-muted);
      margin: var(--space-6) 0;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 1.5em;
      border: 1px solid var(--color-border-default);
    }

    th {
      font-weight: 600;
      text-align: left;
      background: var(--color-bg-container);
      border-bottom: 2px solid var(--color-border-default);
    }

    td {
      border-bottom: 1px solid var(--color-border-default);
    }

    th,
    td {
      padding: var(--space-3) var(--space-4);
    }

    tr:last-child td {
      border-bottom: none;
    }

    mark {
      background: var(--color-highlight-300);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--rounded-sm);
    }

    small {
      font-size: var(--text-sm);
    }

    kbd {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      padding: var(--space-1) var(--space-2);
      background: var(--color-bg-container);
      border: 1px solid var(--color-border-default);
      border-bottom-width: 2px;
      border-radius: var(--rounded);
    }

    sub,
    sup {
      font-size: var(--text-xs);
    }

    abbr {
      text-decoration: underline;
      text-decoration-style: dotted;
      cursor: help;
    }

    p:first-child {
      margin-top: 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
  `;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this._mutationObserver = new MutationObserver(() => this._renderMarkdown());
    this._mutationObserver.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this._renderMarkdown();
  }

  disconnectedCallback() {
    this._mutationObserver?.disconnect();
    super.disconnectedCallback();
  }

  async updated(changedProps: Map<string, any>) {
    if (changedProps.has('content')) {
      this._renderMarkdown();
    }
  }

  async _renderMarkdown() {
    let source = this.content;
    if (!source) {
      // Use light DOM content if no 'content' property is set
      source = this.innerHTML;
    }
    const strippedContent = (source || '').replace(/<!--[\s\S]*?-->/g, '');
    this._renderedContent = await marked(strippedContent);
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="markdown-body">${unsafeHTML(this._renderedContent)}</div>
    `;
  }
}

customElements.define('markdown-text', MarkdownText);
