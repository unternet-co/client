import { ProcessContainer } from '@unternet/kernel';
import './process-view.css';

class ProcessView extends HTMLElement {
  #process: ProcessContainer | null = null;

  set process(process: ProcessContainer | null) {
    if (this.#process && this.#process.unmount) {
      this.#process.unmount();
    }

    this.#process = process;

    if (this.#process && this.#process.mount) {
      console.log('mounting');
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
