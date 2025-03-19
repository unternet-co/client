import { Tab, tabModel } from '../models/tabs';
import { WorkspaceView } from './workspaces/workspace';
import { IDisposable } from '../base/disposable';
import { appendEl, createEl } from '../utils/dom';
import { TopBar } from './top-bar/top-bar';
import './layout.css';

export class AppLayout {
  element: HTMLElement;
  topBar: IDisposable;
  tabContents: IDisposable;

  constructor(el: HTMLElement) {
    this.element = el;

    const topBarContainer = appendEl(
      this.element,
      createEl('div', { className: 'top-bar' })
    );
    this.topBar = new TopBar(topBarContainer);

    const contentsContainer = appendEl(
      this.element,
      createEl('div', { className: 'contents' })
    );

    // Render contents when the active tab changes
    // TODO: Later implement a tab view manager to hide them, not remove from DOM
    this.updateTabView(tabModel.activeTab, contentsContainer);
    tabModel.subscribe((change) => {
      if (change?.activeTab) {
        this.updateTabView(change.activeTab, contentsContainer);
      }
    });
  }

  updateTabView(tab: Tab | undefined, container: HTMLElement) {
    if (!tab) return;
    if (this.tabContents) this.tabContents.dispose();
    if (tab.type === 'workspace') {
      this.tabContents = new WorkspaceView(container);
    }
  }
}
