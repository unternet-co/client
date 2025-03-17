import { html, render } from 'lit';
import { Tab, tabModel } from './tab-model';
import plusIcon from '../common/icons/plus.svg';
import closeIcon from '../common/icons/close.svg';
import './tab-strip.css';

export class TabStrip extends HTMLElement {
  renderRoot = this;
  selected?: string;
  isEditable: boolean = false;
  tabsContainer: HTMLElement;

  connectedCallback() {
    const template = html`
      <ol class="tabs-list"></ol>
      <button class="icon-button" @click=${() => this.handleNewTab()}>
        <img src=${plusIcon} />
      </button>
    `;

    render(template, this);

    this.tabsContainer = document.querySelector('ol.tabs-list');
    this.updateTabs();

    tabModel.onChange(() => this.updateTabs());
  }

  handleNewTab() {
    tabModel.create();
  }

  handleClickTab(id: Tab['id']) {
    tabModel.setActive(id);
  }

  // handleDoubleClickTab() {
  //   this.isEditable = true;
  //   tabTitle.contentEditable = 'true';
  //   this.selectContents(tabTitle);

  //   tabTitle.onblur = () => (this.isEditable = false);

  //   tabTitle.onkeydown = (e: KeyboardEvent) => {
  //     if (e.key === 'Enter') {
  //       e.preventDefault();
  //       tabs.setTitle(this.selected, tabTitle.innerText);
  //       this.isEditable = false;
  //     } else if (e.key === 'Escape') {
  //       this.isEditable = false;
  //     }
  //   };
  // }

  selectContents(elem: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(elem);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  }

  updateTabs() {
    const tabs = tabModel.all();
    render(tabs.map(this.tabTemplate.bind(this)), this.tabsContainer);
  }

  tabTemplate(tab: Tab) {
    const isActive = tab.id === this.selected;
    const isEditable = isActive && this.isEditable;
    return html`
      <li
        class=${'tab-handle' + (isActive ? ' active' : '')}
        id=${'tab-handle-' + tab.id}
        @mousedown=${() => this.handleClickTab(tab.id)}
      >
        <span class="tab-title" contenteditable=${isEditable}
          >${tab.title}</span
        >
        <span class="tab-close-button" @click=${() => tabModel.close(tab.id)}>
          <img src=${closeIcon} />
        </span>
      </li>
    `;
  }
}

customElements.define('tab-strip', TabStrip);
console.log('hiii');
