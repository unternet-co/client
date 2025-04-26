class MessageScroll extends HTMLElement {
  #slot: HTMLSlotElement;
  #container: HTMLDivElement;
  #lastScrollTop = 0;
  #mutationObserver: MutationObserver | null = null;
  #intersectionObserver: IntersectionObserver | null = null;

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
        flex-direction: column-reverse;
        overflow-y: auto;
        scroll-behavior: smooth;
        width: 100%;
      }
    `;
    shadow.appendChild(style);
  }

  connectedCallback() {
    // Set up MutationObserver on slotted element (e.g. message-list)
    const assigned = this.#slot.assignedElements
      ? this.#slot.assignedElements()
      : [];
    if (assigned.length > 0) {
      this.#mutationObserver = new MutationObserver(() => {
        // Wait for the DOM to update
        setTimeout(() => {
          this.#slot.scrollTop = 0;
        }, 100);
      });
      this.#mutationObserver.observe(assigned[0], {
        childList: true,
        subtree: true,
      });
    }

    // Log the scroll position
    // (Timeout is here so we don't take into account scroll event
    // as element becomes visible again)
    this.#slot.addEventListener('scroll', () => {
      setTimeout(() => {
        this.#lastScrollTop = this.#slot.scrollTop;
      }, 100);
    });

    // Whenever element is made visible, return to prior scroll position
    // TODO: since we no longer use tabs, this element is always visible
    // so if we want to manage scroll state we should probably keep track
    // of it in the workspace definition.
    this.#intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.#slot.scrollTop = this.#lastScrollTop;
        }
      }
    });
    this.#intersectionObserver.observe(this);
  }

  disconnectedCallback() {
    if (this.#mutationObserver) {
      this.#mutationObserver.disconnect();
      this.#mutationObserver = null;
    }
    if (this.#intersectionObserver) {
      this.#intersectionObserver.disconnect();
      this.#intersectionObserver = null;
    }
  }
}

customElements.define('message-scroll', MessageScroll);
