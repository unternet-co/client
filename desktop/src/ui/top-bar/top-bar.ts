import { appendEl, createEl } from '../../common/utils/dom';
import { render, html } from 'lit';
import { Tab, TabModel } from '../../tabs';
import { dependencies } from '../../common/dependencies';
import { WorkspaceModel } from '../../workspaces';
import './tab-handle';
import './top-bar.css';
import { ModalService } from '../../modals/modal-service';

// Define electronAPI type for TypeScript
declare global {
  interface Window {
    electronAPI?: {
      onWindowStateChange: (callback: (isFullscreen: boolean) => void) => void;
      removeWindowStateListeners: () => void;
      platform: string;
      isFullScreen: () => Promise<boolean>;
    };
  }
}

// Define electronAPI type for TypeScript
declare global {
  interface Window {
    electronAPI?: {
      onWindowStateChange: (callback: (isFullscreen: boolean) => void) => void;
      removeWindowStateListeners: () => void;
      platform: string;
      isFullScreen: () => Promise<boolean>;
    };
  }
}

export class TopBar extends HTMLElement {
  tabModel = dependencies.resolve<TabModel>('TabModel');
  modalService = dependencies.resolve<ModalService>('ModalService');
  staticTabsContainer?: HTMLElement;
  workspaceTabsContainer?: HTMLElement;
  settingsButtonContainer?: HTMLElement;

  // TODO: Add dependency injection using decorators for model
  connectedCallback() {
    // Container for static tabs (like home)
    this.staticTabsContainer = appendEl(
      this,
      createEl('div', { className: 'static-tab-list' })
    );
    const scrollContainer = appendEl(
      this,
      createEl('div', { className: 'workspace-tabs-scroll-container' })
    );
    this.workspaceTabsContainer = appendEl(
      scrollContainer,
      createEl('div', { className: 'workspace-tab-list' })
    );
    this.settingsButtonContainer = appendEl(
      this,
      createEl('div', { className: 'settings-button-container' })
    );

    this.tabModel.subscribe(this.updateTabs.bind(this));
    this.updateTabs();

    const isMac = window.electronAPI?.platform === 'darwin';
    this.classList.toggle('mac', isMac);
    this.initializeWindowStateListeners();
  }

  disconnectedCallback() {
    if (window.electronAPI) {
      window.electronAPI.removeWindowStateListeners();
    }
  }

  private initializeWindowStateListeners(): void {
    if (window.electronAPI) {
      window.electronAPI
        .isFullScreen()
        .then((isFullscreen) => {
          this.toggleFullscreenClass(isFullscreen);
        })
        .catch((err) => {
          console.error('[TopBar] Error checking fullscreen state:', err);
        });

      window.electronAPI.onWindowStateChange((isFullscreen) => {
        this.toggleFullscreenClass(isFullscreen);
      });
    }
  }

  private toggleFullscreenClass(isFullscreen: boolean): void {
    if (isFullscreen) {
      this.classList.add('fullscreen');
    } else {
      this.classList.remove('fullscreen');
    }
  }

  iconFor(tabId: Tab['id']) {
    if (tabId === 'home') {
      return html`<un-icon name="home"></un-icon>`;
    }
    return null;
  }

  handleSelect(tab: Tab) {
    if (this.tabModel.activeTab?.id !== tab.id) {
      this.tabModel.activate(tab.id);
      // Tab will be scrolled into view after activation in updateTabs
    }
  }

  openSettings() {
    this.modalService.open('settings');
  }

  handleRename(tab: Tab, e: CustomEvent) {
    if (tab.type === 'workspace') {
      const workspaceModel =
        dependencies.resolve<WorkspaceModel>('WorkspaceModel');
      workspaceModel.setTitle(tab.id, e.detail.value);
      this.updateTabs();
    }
  }

  updateTabs() {
    const tabs = this.tabModel.all();
    const staticTabs = tabs.filter((tab) => tab.type === 'page');
    const workspaceTabs = tabs.filter((tab) => tab.type === 'workspace');

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

    const settingsButtonTemplate = html`
      <button class="settings-button" @click=${() => this.openSettings()}>
        <un-icon name="settings"></un-icon>
      </button>
    `;

    render(staticTabs.map(tabTemplate), this.staticTabsContainer!);
    render(workspaceTabs.map(tabTemplate), this.workspaceTabsContainer!);
    render(settingsButtonTemplate, this.settingsButtonContainer!);

    this.scrollActiveTabIntoView();
  }

  private scrollActiveTabIntoView(): void {
    setTimeout(() => {
      const activeTab = this.tabModel.activeTab;
      if (activeTab && activeTab.type === 'workspace') {
        const tabElement = this.querySelector(`#tab-${activeTab.id}`);
        const scrollContainer = this.querySelector(
          '.workspace-tabs-scroll-container'
        );

        if (tabElement && scrollContainer) {
          tabElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
      }
    }, 0);
  }
}

customElements.define('top-bar', TopBar);
