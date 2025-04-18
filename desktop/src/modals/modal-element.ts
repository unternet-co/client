import { ModalPadding, ModalSize } from './modal';

export class ModalElement extends HTMLElement {
  size: ModalSize = 'auto';
  padding: ModalPadding = 'auto';

  close() {
    this.dispatchEvent(new Event('close'));
  }
}
