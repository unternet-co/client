class MessageScroll extends HTMLElement {
  #slot: HTMLSlotElement;
  #autoFollow: boolean = true;

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
        box-sizing: border-box;
        display: flex;
        flex-direction: column-reverse;
        overflow-y: auto;
        scroll-behavior: smooth;
        width: 100%;
      }
    `;
    shadow.appendChild(style);
  }

  /**
   * Keeps the newest message in view until user scrolls up.
   */
  #startAutoFollow = () => {
    this.#autoFollow = true;
    this.#slot.addEventListener('scroll', this.#onUserScroll);
  };

  #stopAutoFollow = () => {
    this.#autoFollow = false;
    this.#slot.removeEventListener('scroll', this.#onUserScroll);
  };

  #onUserScroll = () => {
    // If user scrolls away from the bottom (scrollTop !== 0), stop auto-follow
    if (this.#slot.scrollTop !== 0) {
      this.#stopAutoFollow();
    }
  };

  #scrollToBottom = () => {
    const assigned = this.#slot.assignedElements
      ? this.#slot.assignedElements()
      : [];
    if (assigned.length > 0) {
      assigned[0].scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      this.#slot.scrollTop = 0;
    }
  };

  #onMessageAdded = () => {
    this.#scrollToBottom();
    this.#startAutoFollow();
  };

  connectedCallback() {
    this.#scrollToBottom();
    this.#slot.addEventListener('slotchange', this.#onMessageAdded);
  }

  disconnectedCallback() {
    this.#slot.removeEventListener('slotchange', this.#onMessageAdded);
    this.#stopAutoFollow();
  }
}

customElements.define('message-scroll', MessageScroll);
