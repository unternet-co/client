import { appendEl, createEl } from '../../utils/dom';
import { render, html } from 'lit';
import './tab-handle';
import './top-bar.css';
import { ICON_GLYPHS } from '../common/icon';
import { Tab, TabModel } from '../../models/tabs';
import { dependencies } from '../../base/dependencies';

export class TopBar extends HTMLElement {
  tabModel: TabModel;
  tabsContainer: HTMLElement;

  constructor() {
    super();
    this.tabModel = dependencies.resolve('TabModel');
  }

  // TODO: Add dependency injection using decorators for model
  connectedCallback() {
    this.tabsContainer = appendEl(
      this,
      createEl('div', { className: 'tab-list' })
    );

    this.tabModel.subscribe(this.updateTabs.bind(this));
    this.updateTabs();
  }

  iconFor(tabId: Tab['id']) {
    if (tabId === 'home') {
      return html`<un-icon src=${ICON_GLYPHS.home}></un-icon>`;
    }
    return null;
  }

  handleSelect(tab: Tab) {
    if (this.tabModel.activeTab?.id !== tab.id) {
      this.tabModel.activate(tab.id);
    }
  }

  updateTabs() {
    const tabs = this.tabModel.all();

    const tabTemplate = (tab: Tab) => html`
      <tab-handle
        ?static=${tab.type === 'page'}
        ?active=${this.tabModel.activeTab?.id === tab.id}
        @select=${() => this.handleSelect(tab)}
        @close=${() => this.tabModel.close(tab.id)}
      >
        ${tab.type === 'page'
          ? this.iconFor(tab.id)
          : this.tabModel.getTitle(tab.id)}
      </tab-handle>
    `;

    render(tabs.map(tabTemplate), this.tabsContainer);
  }

  disconnectedCallback() {
    this.tabModel.dispose();
  }
}

customElements.define('top-bar', TopBar);
