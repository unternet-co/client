import { Tab, tabModel } from '../stores/tabs';
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
    tabModel.subscribe(() => this.updateContents());
  }

  updateContents() {
    const contentViews = tabModel.all().map(this.viewForTab.bind(this));
    render(contentViews, this.contentEl);
  }

  viewForTab(tab: Tab) {
    if (!tab) return;
    const isActive = tab.id === tabModel.activeTab?.id;
    if (tab.type === 'workspace') {
      return html`<workspace-view
        for=${tab.id}
        ?active=${isActive}
      ></workspace-view>`;
    }
  }
}

customElements.define('app-root', AppRoot);
