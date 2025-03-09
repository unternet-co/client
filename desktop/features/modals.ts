// import { ModalBox } from '../components/modal-box';

import { html, render } from 'lit';
import '../modals.css';

interface ModalSpecification {
  title: string;
}

const activeModals: Modal[] = [];

function create(spec: ModalSpecification) {
  // Create a root container for the modal
  const modalRoot = document.createElement('div');
  modalRoot.classList.add('modal-overlay');
  modalRoot.style.zIndex = `${300 + activeModals.length}`;
  document.body.appendChild(modalRoot);

  // Create the modal window & add it to the register
  const modal = new Modal(modalRoot, spec);
  activeModals.push(modal);

  // Add close event handlers
  modalRoot.onmousedown = () => modal.close();

  return modal;
}

class Modal {
  title: string;
  root: HTMLElement;
  contents: HTMLElement;

  constructor(root: HTMLElement, spec: ModalSpecification) {
    this.title = spec.title;
    this.root = root;
    render(this.template(), this.root);
    this.contents = root.querySelector('.modal-contents');
  }

  close() {
    const index = activeModals.indexOf(this);
    if (index > -1) {
      activeModals.splice(index, 1);
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

export const modals = { create };
