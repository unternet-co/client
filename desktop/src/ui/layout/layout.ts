import './layout.css';
import '../tab-strip';
import { ITab, tabStore } from '../../models/tabs';
import '../workspace/command-bar';
import '../workspace/workspace-view';
import '../workspace/resource-bar';
import { appendEl, createEl } from '../../utils/dom';

export class AppLayout {
  tabContentsContainer: HTMLElement;

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
    if (tab.type === 'workspace') {
      const template = /*html*/ `
        <div class="workspace">
          <workspace-view></workspace-view>
          <command-bar></command-bar>
          <resource-bar></resource-bar>
        </div>
      `;

      this.tabContentsContainer.innerHTML = template;
    }
  }
}
