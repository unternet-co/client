import { ModalSize } from './modal';

export class ModalElement extends HTMLElement {
  size: ModalSize = 'auto';

  close() {
    this.dispatchEvent(new Event('close'));
  }
}
