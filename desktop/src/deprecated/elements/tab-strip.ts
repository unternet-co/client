import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tabs, type Tab } from '../tabs';
import './tab-strip.css';
import { config } from '../config';
import plusIcon from '../../common/icons/plus.svg';
import closeIcon from '../../common/icons/close.svg';

@customElement('tab-strip')
export class TabStrip extends LitElement {
  renderRoot = this;

  @property({ attribute: false })
  tabs: Tab[] = [];

  @property({ type: Number })
  selected: number = -1;

  @property({ type: Boolean })
  isEditable: boolean = false;

  connectedCallback() {
    super.connectedCallback();
    tabs.subscribe(tabs.all, this.setTabs.bind(this));
    config.subscribeToKey('activeTab', (tabId) => (this.selected = tabId));
  }

  setTabs(tabs: Tab[]) {
    this.tabs = tabs;
    if (this.tabs.length && this.selected < 0) this.selected = tabs[0].id;
  }

  handleDoubleClickTab() {
    this.isEditable = true;
    console.log(`tab-handle-${this.selected} > .tab-title`);
    const tabTitle = this.querySelector(
      `#tab-handle-${this.selected} > .tab-title`
    ) as HTMLElement;
    console.log(tabTitle);
    tabTitle.contentEditable = 'true';
    this.selectContents(tabTitle);

    tabTitle.onblur = () => (this.isEditable = false);

    tabTitle.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        tabs.setTitle(this.selected, tabTitle.innerText);
        this.isEditable = false;
      } else if (e.key === 'Escape') {
        this.isEditable = false;
      }
    };
  }

  async setActiveTab(id: Tab['id']) {
    await config.set('activeTab', id);
  }

  selectContents(elem: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(elem);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  }

  createTab() {
    tabs.create();
  }

  tabTemplate(tab: Tab) {
    const isActive = tab.id === this.selected;
    const isEditable = isActive && this.isEditable;
    return html`
      <li
        class=${'tab-handle' + (isActive ? ' active' : '')}
        id=${'tab-handle-' + tab.id}
        @mousedown=${() => this.setActiveTab(tab.id)}
      >
        <span
          class="tab-title"
          contenteditable=${isEditable}
          @dblclick=${this.handleDoubleClickTab.bind(this)}
          >${tab.title}</span
        >
        <span class="tab-close-button" @click=${() => tabs.close(tab.id)}>
          <img src=${closeIcon} />
        </span>
      </li>
    `;
  }

  render() {
    return html`
      <ol class="tabs-list">
        ${this.tabs.map(this.tabTemplate.bind(this))}
      </ol>
      <button class="icon-button" @click=${this.createTab.bind(this)}>
        <img src=${plusIcon} />
      </button>
    `;
  }
}
