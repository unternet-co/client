import { appendEl, createEl } from '../../utils/dom';
import { render, html } from 'lit';
import { ICON_GLYPHS } from '../common/icon';
import { Tab, TabModel } from '../../models/tabs';
import { dependencies } from '../../base/dependencies';
import { WorkspaceModel } from '../../models/workspaces';
import { SettingsPage } from '../pages/settings-page';
import './tab-handle';
import './top-bar.css';

export class TopBar extends HTMLElement {
  tabModel = dependencies.resolve<TabModel>('TabModel');
  staticTabsContainer: HTMLElement;
  workspaceTabsContainer: HTMLElement;
  settingsTabContainer: HTMLElement;

  // TODO: Add dependency injection using decorators for model
  connectedCallback() {
    // Container for static tabs (like home)
    this.staticTabsContainer = appendEl(
      this,
      createEl('div', { className: 'static-tab-list' })
    );
    
    // Scrollable container for workspace tabs
    const scrollContainer = appendEl(
      this,
      createEl('div', { className: 'workspace-tabs-scroll-container' })
    );
    
    // Container for workspace tabs inside the scroll container
    this.workspaceTabsContainer = appendEl(
      scrollContainer,
      createEl('div', { className: 'workspace-tab-list' })
    );
    
    // Container for settings tab (right-justified)
    this.settingsTabContainer = appendEl(
      this,
      createEl('div', { className: 'settings-tab-container' })
    );

    this.tabModel.subscribe(this.updateTabs.bind(this));
    this.updateTabs();
  }

  iconFor(tabId: Tab['id']) {
    if (tabId === 'home') {
      return html`<un-icon src=${ICON_GLYPHS.home}></un-icon>`;
    }
    if (tabId === 'settings') {
      return html`<un-icon src=${ICON_GLYPHS.settings}></un-icon>`;
    }
    return null;
  }

  handleSelect(tab: Tab) {
    if (tab.id === 'settings') {
      // Open a settings modal instead of navigating to a tab
      SettingsPage.open();
    } else if (this.tabModel.activeTab?.id !== tab.id) {
      this.tabModel.activate(tab.id);
      // Tab will be scrolled into view after activation in updateTabs
    }
  }

  handleRename(tab: Tab, e: CustomEvent) {
    if (tab.type === 'workspace') {
      const workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');
      workspaceModel.setTitle(tab.id, e.detail.value);
      
      // Force an immediate UI update by re-rendering all tabs
      this.updateTabs();
    }
  }

  updateTabs() {
    const tabs = this.tabModel.all();
    const staticTabs = tabs.filter(tab => tab.type === 'page' && tab.id !== 'settings');
    const workspaceTabs = tabs.filter(tab => tab.type === 'workspace');
    const settingsTab = tabs.find(tab => tab.id === 'settings');

    const tabTemplate = (tab: Tab) => html`
      <tab-handle
        ?static=${tab.type === 'page'}
        ?active=${this.tabModel.activeTab?.id === tab.id}
        @select=${() => this.handleSelect(tab)}
        @close=${() => this.tabModel.close(tab.id)}
        @rename=${(e: CustomEvent) => this.handleRename(tab, e)}
        id=${`tab-${tab.id}`}
      >
        ${tab.type === 'page'
          ? this.iconFor(tab.id)
          : this.tabModel.getTitle(tab.id)}
      </tab-handle>
    `;

    render(staticTabs.map(tabTemplate), this.staticTabsContainer);
    render(workspaceTabs.map(tabTemplate), this.workspaceTabsContainer);
    render(tabTemplate(settingsTab!), this.settingsTabContainer);
    
    this.scrollActiveTabIntoView();
  }
  
  private scrollActiveTabIntoView(): void {
    // Wait for the DOM to update
    setTimeout(() => {
      const activeTab = this.tabModel.activeTab;
      if (activeTab && activeTab.type === 'workspace') {
        const tabElement = this.querySelector(`#tab-${activeTab.id}`);
        const scrollContainer = this.querySelector('.workspace-tabs-scroll-container');
        
        if (tabElement && scrollContainer) {
          // Use scrollIntoView with behavior: 'smooth' for a nice animation
          tabElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      }
    }, 0);
  }
}

customElements.define('top-bar', TopBar);
