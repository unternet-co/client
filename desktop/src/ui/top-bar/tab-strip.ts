import { html, render } from 'lit';
import { ITab, tabStore } from '../../models/tabs';
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
        <img src="/icons/plus.svg" />
      </button>
    `;

    render(template, this);

    this.tabsContainer = document.querySelector('ol.tabs-list')!;
    this.updateTabs();

    tabStore.subscribe(() => this.updateTabs());
  }

  handleNewTab() {
    tabStore.create();
  }

  handleClickTab(id: ITab['id']) {
    tabStore.setActive(id);
  }

  selectContents(elem: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(elem);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  }

  updateTabs() {
    const tabs = tabStore.all();
    render(tabs.map(this.tabTemplate.bind(this)), this.tabsContainer);
  }

  tabTemplate(tab: ITab) {
    const isActive = tab.id === tabStore.activeTab!.id;
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
        <span class="tab-close-button" @click=${() => tabStore.close(tab.id)}>
          <img src="/icons/close.svg" />
        </span>
      </li>
    `;
  }
}

customElements.define('tab-strip', TabStrip);
