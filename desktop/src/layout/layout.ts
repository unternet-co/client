import './style.css';
import { TabStrip } from '../tabs/tab-strip';
import { appendEl, createEl } from '../utils';

export class MainLayout {
  element: HTMLElement;
  private contentsEl: HTMLElement;
  private tabStrip: TabStrip;

  constructor(parentEl: HTMLElement) {
    this.element = appendEl(
      parentEl,
      createEl('main', { className: 'layout' })
    );

    const topBar = appendEl(
      this.element,
      createEl('div', { className: 'top-bar' })
    );

    this.tabStrip = new TabStrip(topBar);

    this.contentsEl = appendEl(
      parentEl,
      createEl('div', { className: 'contents' })
    );
  }
}
