import { ProcessContainer } from '@unternet/kernel';

class ProcessView extends HTMLElement {
  #process: ProcessContainer | null = null;

  set process(process: ProcessContainer | null) {
    console.log('setting process');
    if (this.#process && this.#process.unmount) {
      console.log('unmounting');
      this.#process.unmount();
    }

    this.#process = process;

    if (this.#process && this.#process.mount) {
      console.log('mounting');
      this.#process.mount(this);
    }
  }

  disconnectedCallback() {
    console.log('unmountin');
    if (this.#process?.unmount) {
      this.#process.unmount();
    }
  }
}

customElements.define('process-view', ProcessView);
