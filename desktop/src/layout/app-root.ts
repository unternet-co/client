class AppRoot extends HTMLElement {
  connectedCallback() {
    this.innerHTML = /*html*/ `
      <top-bar></top-bar>
      <div class="contents">
        
      </div>
    `;
  }
}
