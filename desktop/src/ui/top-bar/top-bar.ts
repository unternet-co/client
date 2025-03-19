import { Tab, TabModel, tabModel } from '../../stores/tabs';
import { appendEl, createEl } from '../../utils/dom';
import { render, html } from 'lit';
import './tab-handle';
import './top-bar.css';

export class TopBar extends HTMLElement {
  tabModel: TabModel;
  tabsContainer: HTMLElement;

  // TODO: Add dependency injection using decorators for model
  connectedCallback() {
    this.tabModel = tabModel;

    this.tabsContainer = appendEl(
      this,
      createEl('div', { className: 'tab-list' })
    );

    tabModel.subscribe(this.updateTabs.bind(this));
    this.updateTabs();
  }

  updateTabs() {
    const tabs = tabModel.all();

    const tabTemplate = (tab: Tab) => html`
      <tab-handle
        ?active=${tabModel.activeTab?.id === tab.id}
        @select=${() => tabModel.setActive(tab)}
        @close=${() => tabModel.close(tab)}
      >
        ${tab.title}
      </tab-handle>
    `;

    render(tabs.map(tabTemplate), this.tabsContainer);
  }

  disconnectedCallback() {
    tabModel.dispose();
  }
}

customElements.define('top-bar', TopBar);
