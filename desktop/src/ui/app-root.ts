import { Tab, tabStore } from '../stores/tabs';
import { appendEl, createEl } from '../utils/dom';
import { html, render } from 'lit';
import './top-bar/top-bar';
import './workspaces/workspace-view';
import './app-root.css';

export class AppRoot extends HTMLElement {
  private contentEl: HTMLElement;

  connectedCallback() {
    appendEl(this, createEl('top-bar'));
    this.contentEl = appendEl(this, createEl('div', { className: 'contents' }));

    this.updateContents();
    tabStore.subscribe(() => this.updateContents());
  }

  updateContents() {
    const contentViews = tabStore.all().map(this.viewForTab.bind(this));
    render(contentViews, this.contentEl);
  }

  viewForTab(tab: Tab) {
    if (!tab) return;
    const isActive = tab.id === tabStore.activeTab?.id;
    if (tab.type === 'workspace') {
      return html`<workspace-view
        for=${tab.id}
        ?active=${isActive}
      ></workspace-view>`;
    }
  }
}

customElements.define('app-root', AppRoot);
