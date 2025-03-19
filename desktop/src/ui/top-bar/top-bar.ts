import { Disposable } from '../../base/disposable';
import { Tab, TabModel, tabModel } from '../../models/tabs';
import { appendEl, createEl } from '../../utils/dom';
import { render, html } from 'lit';
import './tab-handle';
import './top-bar.css';

export class TopBar extends Disposable {
  element: HTMLElement;
  tabModel: TabModel;
  tabsContainer: HTMLElement;

  // TODO: Add dependency injection using decorators for model
  constructor(el: HTMLElement) {
    super();
    this.element = el;
    this.tabModel = tabModel;

    this.tabsContainer = appendEl(
      this.element,
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
}
