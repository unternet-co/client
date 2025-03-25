class MessageScroll extends HTMLElement {
  #slot: HTMLElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const container = document.createElement('div');
    container.classList.add('container');
    shadow.appendChild(container);

    this.#slot = document.createElement('slot');
    this.#slot.part = 'slot';
    container.appendChild(this.#slot);

    const style = document.createElement('style');
    style.textContent = /*css*/ `
      .container {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      slot {
        display: flex;
        flex-direction: column-reverse;
        overflow-y: auto;
        width: 100%;
      }
    `;
    shadow.appendChild(style);
  }

  connectedCallback() {
    this.#slot.scrollTop = this.#slot.scrollHeight;
  }
}

customElements.define('message-scroll', MessageScroll);
