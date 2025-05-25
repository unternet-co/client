import { ProcessContainer } from '@unternet/kernel';
import './process-view.css';

// TODO: Needs to be more robust. The whole element must be
// destroyed on unmount
class ProcessView extends HTMLElement {
  #process: ProcessContainer | null = null;

  set process(process: ProcessContainer | null) {
    if (this.#process && this.#process.unmount) {
      this.#process.unmount();
    }

    this.innerHTML = '';
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
