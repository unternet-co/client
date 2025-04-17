import { marked } from 'marked';
import { attachStyles } from '../../common/utils';

class MarkdownText extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    attachStyles(shadow, this.styles);
  }

  connectedCallback() {
    this.render();
    this.observeContentChanges();
  }

  async render() {
    const content = this.innerHTML;
    const strippedContent = content.replace(/<!--[\s\S]*?-->/g, '');
    const renderedContent = await marked(strippedContent);
    this.shadowRoot.innerHTML = renderedContent;
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
    return /*css*/ `
      p:first-child {
        margin-top: 0;
      }

      p:last-child {
        margin-bottom: 0;
      }

      p, ul, ol, blockquote {
        margin: var(--space-4) 0;
      }
    `;
  }
}

customElements.define('markdown-text', MarkdownText);
