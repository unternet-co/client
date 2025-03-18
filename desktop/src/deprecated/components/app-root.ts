import './common/global.css';
import './app-root.css';
import './tabs/tab-strip';

class AppRoot extends HTMLElement {
  connectedCallback() {
    this.innerHTML = /*html*/ `
      <div class="top-bar">
        <tab-strip></tab-strip>
      </div>
      <div class="contents">
        
      </div>
    `;
  }
}

customElements.define('app-root', AppRoot);
