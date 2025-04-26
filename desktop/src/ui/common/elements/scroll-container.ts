class MessageScroll extends HTMLElement {
  #slot: HTMLSlotElement;
  #container: HTMLDivElement;
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
        justify-content: flex-end;
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

  static get observedAttributes() {
    return ['scroll-position'];
  }

  #pendingScrollPosition: number | null = null;

  get scrollPosition(): number | undefined {
    const val = this.getAttribute('scroll-position');
    return val !== null ? Number(val) : undefined;
  }

  set scrollPosition(pos: number | undefined) {
    if (typeof pos === 'number') {
      this.setAttribute('scroll-position', String(pos));
      // Don't set scroll position immediately. Wait for content change.
      this.#pendingScrollPosition = pos;
    } else {
      this.removeAttribute('scroll-position');
      this.#pendingScrollPosition = null;
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'scroll-position' && newValue !== oldValue) {
      this.#pendingScrollPosition = Number(newValue);
    }
  }

  /**
   * Sets the scroll position of the message container to the given value.
   * @param scrollTop The scroll position to set.
   */
  public setScrollPosition(scrollTop: number) {
    if (this.#slot) {
      const current = this.#slot.scrollTop;
      const distance = Math.abs(current - scrollTop);
      const threshold = 3000;

      if (distance > threshold) {
        this.#slot.style.scrollBehavior = 'auto';
      }

      this.#slot.scrollTop = scrollTop;

      if (distance > threshold) {
        setTimeout(() => {
          this.#slot.style.scrollBehavior = '';
        }, 0);
      }
    }
  }

  connectedCallback() {
    const assigned = this.#slot.assignedElements
      ? this.#slot.assignedElements()
      : [];
    if (assigned.length > 0) {
      this.#mutationObserver = new MutationObserver(() => {
        setTimeout(() => {
          if (
            this.#pendingScrollPosition !== null &&
            !isNaN(this.#pendingScrollPosition)
          ) {
            this.setScrollPosition(this.#pendingScrollPosition);
            this.#pendingScrollPosition = null;
          } else {
            this.setScrollPosition(0); // Always scroll to bottom if no explicit scroll requested
          }
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
        this.dispatchEvent(
          new CustomEvent('scroll-position-changed', {
            detail: { scrollTop: this.#slot.scrollTop },
            bubbles: true,
            composed: true,
          })
        );
      }, 100);
    });
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
