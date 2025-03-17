import { appendEl, createEl } from '../utils';
import plusIcon from '../common/icons/plus.svg';
import { Tab, tabModel } from './tab-model';
import './tab-strip.css';

export class TabStrip {
  readonly element: HTMLElement;
  private tabListContainer: HTMLElement;
  private newTabButton: HTMLElement;

  constructor(parentEl: HTMLElement) {
    this.element = parentEl.appendChild(
      createEl('div', { className: 'tab-strip' })
    );

    this.tabListContainer = createEl('ol', { className: 'tab-list' });
    this.newTabButton = createEl('icon-button', { iconsrc: plusIcon });
    this.newTabButton.addEventListener('click', () => {});

    this.element.appendChild(this.tabListContainer);
    this.element.appendChild(this.newTabButton);

    tabModel.onChange(() => this.updateTabs());
    this.updateTabs();
  }

  updateTabs() {
    const tabs = tabModel.all();
    this.tabListContainer.innerHTML = '';
    for (const index in tabs) {
      appendEl(this.tabListContainer, this.createTab(tabs[index]));
    }
  }

  createTab(tab: Tab): HTMLElement {
    const tabEl = createEl('li', { className: 'tab-handle' });
    tabEl.dataset.id = tab.id;
    const text = appendEl(tabEl, createEl('span'));
    text.innerText = tab.title;
    return tabEl;
  }
}
