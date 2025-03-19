import { tabStore } from '../../stores/tab-store';
import { Tab } from '../../data-types';
import { appendEl, createEl } from '../../utils/dom';
import { render, html } from 'lit';
import './tab-handle';
import './top-bar.css';

export class TopBar extends HTMLElement {
  tabStore: typeof tabStore;
  tabsContainer: HTMLElement;

  // TODO: Add dependency injection using decorators for model
  connectedCallback() {
    this.tabStore = tabStore;

    this.tabsContainer = appendEl(
      this,
      createEl('div', { className: 'tab-list' })
    );

    tabStore.subscribe(this.updateTabs.bind(this));
    this.updateTabs();
  }

  updateTabs() {
    const tabs = tabStore.all();

    const tabTemplate = (tab: Tab) => html`
      <tab-handle
        ?active=${tabStore.activeTab?.id === tab.id}
        @select=${() => tabStore.setActive(tab)}
        @close=${() => tabStore.close(tab)}
      >
        ${tab.title}
      </tab-handle>
    `;

    render(tabs.map(tabTemplate), this.tabsContainer);
  }

  disconnectedCallback() {
    tabStore.dispose();
  }
}

customElements.define('top-bar', TopBar);
