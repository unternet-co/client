import { Process } from '@unternet/kernel';

class ProcessView extends HTMLElement {
  #process: Process | null = null;

  set process(process: Process | null) {
    if (this.#process && this.#process.unmount) {
      this.#process.unmount();
    }

    this.#process = process;

    if (this.#process && this.#process.mount) {
      this.#process.mount(this);
    }
  }

  disconnectedCallback() {
    if (this.#process?.unmount) {
      this.#process.unmount();
    }
  }
}

customElements.define('process-view', ProcessView);
