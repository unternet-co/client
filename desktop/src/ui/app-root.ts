import { appendEl, createEl } from '../common/utils/dom';
import { html, render } from 'lit';
import './top-bar/top-bar';
import './pages/home-page';
import './workspaces/workspace-view';
import './app-root.css';
import { Tab, TabModel } from '../core/tabs';
import { dependencies } from '../common/dependencies';

export class AppRoot extends HTMLElement {
  private contentEl: HTMLElement;
  tabModel = dependencies.resolve<TabModel>('TabModel');

  connectedCallback() {
    appendEl(this, createEl('top-bar'));
    this.contentEl = appendEl(this, createEl('div', { className: 'contents' }));

    this.updateContents();
    this.tabModel.subscribe(() => this.updateContents());
  }

  updateContents() {
    const contentViews = this.tabModel.all().map(this.viewForTab.bind(this));
    render(contentViews, this.contentEl);
  }

  viewForTab(tab: Tab) {
    if (!tab) return;
    const isActive = tab.id === this.tabModel.activeTab?.id;
    if (tab.type === 'workspace') {
      return html`<workspace-view
        class="hide-unless-active"
        for=${tab.id}
        ?active=${isActive}
      ></workspace-view>`;
    } else if (tab.type === 'page' && tab.id === 'home') {
      return html`<home-page
        class="hide-unless-active"
        ?active=${isActive}
      ></home-page>`;
    }
  }
}

customElements.define('app-root', AppRoot);
