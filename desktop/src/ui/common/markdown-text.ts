import { marked } from 'marked';

class MarkdownText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.observeContentChanges();
  }

  async render() {
    const content = this.innerHTML;
    const renderedContent = await marked(content);
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
}

customElements.define('markdown-text', MarkdownText);
