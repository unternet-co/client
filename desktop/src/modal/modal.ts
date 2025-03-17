// import { ModalBox } from '../components/modal-box';

import { html, render } from 'lit';
import './modal.css';

interface ModalInit {
  title: string;
}

export class Modal {
  static activeModals: Modal[] = [];
  title: string;
  root: HTMLElement;
  contents: HTMLElement;

  constructor(root: HTMLElement, spec: ModalInit) {
    this.title = spec.title;
    this.root = root;
    render(this.template(), this.root);
    this.contents = root.querySelector('.modal-contents');
  }

  static create(init: ModalInit) {
    // Create a root container for the modal
    const modalRoot = document.createElement('div');
    modalRoot.classList.add('modal-overlay');
    modalRoot.style.zIndex = `${300 + Modal.activeModals.length}`;
    document.body.appendChild(modalRoot);

    // Create the modal window & add it to the register
    const modal = new Modal(modalRoot, init);
    Modal.activeModals.push(modal);

    // Add close event handlers
    modalRoot.onmousedown = () => modal.close();

    return modal;
  }

  close() {
    const index = Modal.activeModals.indexOf(this);
    if (index > -1) {
      Modal.activeModals.splice(index, 1);
    }
    this.root.remove();
  }

  template() {
    return html`<div class="modal-container">
      <div class="modal-header">${this.title}</div>
      <div class="modal-contents"></div>
    </div>`;
  }
}
