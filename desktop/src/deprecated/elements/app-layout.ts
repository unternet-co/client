export class AppLayout extends HTMLElement {
  connectedCallback() {
    this.innerHTML = /*html*/ `
      <top-bar></top-bar>
      <thread-view></thread-view>
      <command-bar></command-bar>
      <resource-bar></resource-bar>
    `;

    this.resourceBar = new ResourceBar(document.querySelector('.resource-bar'))
  }
}
