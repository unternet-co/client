import { ITab, tabStore } from '../models/tabs';
import './layout.css';
import './top-bar/tab-strip';
import './workspaces/command-bar';
import './workspaces/resource-bar';
import { WorkspaceView } from './workspaces/workspace';
import { IDisposable } from '../base/disposable';

export class AppLayout {
  tabContentsContainer: HTMLElement;
  tabContentsDisposable: IDisposable;

  constructor(el: HTMLElement) {
    const template = /*html*/ `
      <main>
        <div class="top-bar">
          <tab-strip></tab-strip>
        </div>
        <div class="contents"></div>
      </main>
    `;

    el.innerHTML = template;
    this.tabContentsContainer = el.querySelector('.contents')!;
    if (tabStore.activeTab) this.updateTabView(tabStore.activeTab);

    tabStore.subscribe((change) => {
      if (change?.activeTab) this.updateTabView(change.activeTab);
    });
  }

  // TODO: Keep all views active, just change visibility
  // Implement some sort of tab view manager
  updateTabView(tab: ITab) {
    if (this.tabContentsDisposable) this.tabContentsDisposable.dispose();
    if (tab.type === 'workspace') {
      this.tabContentsDisposable = new WorkspaceView(this.tabContentsContainer);
    }
  }
}
