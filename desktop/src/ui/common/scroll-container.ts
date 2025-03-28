class MessageScroll extends HTMLElement {
  #slot;
  #lastScrollTop = 0;

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
    // Scroll to bottom (= 0 with column-reverse) on connect
    this.#slot.scrollTop = 0;

    // Log the scroll position
    // (Timeout is here so we don't take into account scroll event
    // as element becomes visible again)
    this.#slot.addEventListener('scroll', () => {
      setTimeout(() => {
        this.#lastScrollTop = this.#slot.scrollTop;
      }, 100);
    });

    // Whenever element is made visible, return to prior scroll position
    const intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.#slot.scrollTop = this.#lastScrollTop;
        }
      }
    });
    intersectionObserver.observe(this);
  }
}

customElements.define('message-scroll', MessageScroll);
