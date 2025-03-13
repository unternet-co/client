import './style.css';

export class MainLayout {
  el: HTMLElement;

  constructor(el: HTMLElement) {
    this.el = el;
    el.innerHTML = /*html*/ `
      <div class="top-bar"></div>
      <div class="tab-view"></div>
    `;
  }
}
