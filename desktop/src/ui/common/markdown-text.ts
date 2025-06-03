import { marked } from 'marked';
import { attachStyles } from '../../common/utils';
import { css } from 'lit';

class MarkdownText extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    attachStyles(shadow, this.styles.toString());
  }

  connectedCallback() {
    this.render();
    this.observeContentChanges();
  }

  async render() {
    const content = this.innerHTML;
    const strippedContent = content.replace(/<!--[\s\S]*?-->/g, '');
    const renderedContent = await marked(strippedContent);
    if (!this.shadowRoot) {
      console.error('Shadow root not available');
      return;
    }
    this.shadowRoot.innerHTML = renderedContent;

    // Add click handlers for links
    const links = this.shadowRoot.querySelectorAll('a');
    links.forEach((link) => {
      link.addEventListener('click', async (e) => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Handle file:// URLs
        if (href.startsWith('file://')) {
          e.preventDefault();
          try {
            if (
              !window.electronAPI?.fileURLToPath ||
              !window.electronAPI?.openFileWithDefault
            ) {
              throw new Error('Required Electron APIs not available');
            }
            const filePath = window.electronAPI.fileURLToPath(href);
            const result =
              await window.electronAPI.openFileWithDefault(filePath);
            if ('error' in result) {
              console.error('Failed to open file:', result.error);
            }
          } catch (error) {
            console.error('Error handling file link:', error);
          }
        }
      });
    });
  }

  observeContentChanges() {
    const observer = new MutationObserver(() => this.render());
    observer.observe(this, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  get styles() {
    return css`
      :host {
        max-width: 65ch;
        line-height: 1.5;
      }

      *:first-child {
        margin-top: 0;
      }

      *:last-child {
        margin-bottom: 0;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin-top: var(--space-7);
        margin-bottom: var(--space-4);
        line-height: var(--leading-tight);
        font-weight: 600;
      }

      p,
      ul,
      ol,
      blockquote {
        margin-bottom: var(--space-4);
      }

      ul,
      ol {
        padding-left: var(--space-8);
      }

      li {
        margin-bottom: var(--space-2);
      }

      a {
        color: var(--color-action-800);
        text-underline-offset: var(--space-1);
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
        padding: var(--space-4);
        background: var(--color-bg-page);
        border-radius: 6px;
        overflow-x: auto;
        margin-bottom: var(--space-4);
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
        background: var(--color-bg-page);
        border-radius: var(--rounded);
      }

      hr {
        border: none;
        border-top: 1px solid var(--color-border-muted);
        margin: var(--space-5) 0;
      }

      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-bottom: var(--space-4);
      }

      th {
        font-weight: 600;
        text-align: left;
        background: var(--color-bg-container);
        border-bottom: 1px solid var(--color-border-default);
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

      a {
        color: var(--color-action-600);
      }
    `;
  }
}

customElements.define('markdown-text', MarkdownText);
