class MessageScroll extends HTMLElement {
  #slot: HTMLSlotElement;
  #container: HTMLElement;
  #autoFollow: boolean = false;
  #activeMessageMutationObserver: MutationObserver | null = null;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    this.#container = document.createElement('div');
    this.#container.classList.add('container');
    shadow.appendChild(this.#container);

    this.#slot = document.createElement('slot');
    this.#slot.setAttribute('part', 'slot');
    this.#container.appendChild(this.#slot);

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
        flex-direction: column;
        overflow-y: auto;
        scroll-behavior: smooth;;
        width: 100%;
        scroll-margin-bottom: 20px;
      }
    `;
    shadow.appendChild(style);
  }

  #startObservingActiveMessage = () => {
    this.#stopObservingActiveMessage();
    const assigned = this.#slot.assignedElements
      ? this.#slot.assignedElements()
      : [];
    if (assigned.length < 1) return;

    const activeMessageEl = assigned[assigned.length - 1];
    this.#activeMessageMutationObserver = new MutationObserver(() => {
      if (this.#autoFollow) {
        this.#scrollToBottom();
      }
    });
    this.#activeMessageMutationObserver.observe(activeMessageEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  };

  #stopObservingActiveMessage = () => {
    if (this.#activeMessageMutationObserver) {
      this.#activeMessageMutationObserver.disconnect();
      this.#activeMessageMutationObserver = null;
    }
  };

  /**
   * autoFollow Keeps the newest message in view until user scrolls up.
   */
  #onUserScroll = () => {
    const threshold = 3;
    const slot = this.#slot;
    const nearBottom =
      slot.scrollHeight - slot.scrollTop - slot.clientHeight < threshold;
    if (nearBottom) {
      this.#autoFollow = true;
    } else {
      this.#autoFollow = false;
    }
  };

  #scrollToBottom = () => {
    // Small delay to ensure the messages have all rendered
    setTimeout(() => {
      this.#slot.scrollTop = this.#slot.scrollHeight;
    }, 100);
  };

  #onMessageAdded = () => {
    this.#scrollToBottom();
    this.#startObservingActiveMessage();
  };

  connectedCallback() {
    this.#scrollToBottom();
    this.#slot.addEventListener('slotchange', this.#onMessageAdded);
    this.#slot.addEventListener('scroll', this.#onUserScroll);
  }

  disconnectedCallback() {
    this.#slot.removeEventListener('slotchange', this.#onMessageAdded);
    this.#stopObservingActiveMessage();
    this.#slot.removeEventListener('scroll', this.#onUserScroll);
  }
}

customElements.define('message-scroll', MessageScroll);
