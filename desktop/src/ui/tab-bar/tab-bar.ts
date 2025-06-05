import { html, HTMLTemplateResult, render } from 'lit';
import './tab-handle';
import './tab-bar.css';
import { Tab } from './types';

const tabs: Tab[] = [{ title: 'hello' }, { title: 'world' }];

export class TabBar extends HTMLElement {
  tabs: Tab[] = [];

  connectedCallback() {
    this.tabs = tabs;
    this.render();
  }

  handleSelectTab(index: number) {
    console.log('Selected tab', index);
  }

  render() {
    const template: HTMLTemplateResult[] = [];

    template.push(
      html`<un-button
        .icon=${'home'}
        .variant=${'ghost'}
        .iconSize=${'medium'}
      ></un-button> `
    );

    this.tabs.forEach((tab, index) => {
      template.push(
        html`<tab-handle
          .tab=${tab}
          @select=${() => this.handleSelectTab(index)}
          ?selected=${index === 0}
        ></tab-handle> `
      );
    });
    render(template, this);
  }
}

customElements.define('tab-bar', TabBar);
