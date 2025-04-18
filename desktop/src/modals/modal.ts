import { html, render } from 'lit';
import { ModalDefinition, ModalService } from './modal-service';
import { dependencies } from '../common/dependencies';
import { ShortcutService } from '../shortcuts/shortcut-service';
import { createEl } from '../common/utils/dom';
import './modal.css';
import '../ui/common/button';
import '../ui/common/icon';
import { ModalElement } from './modal-element';

export type ModalSize = 'full' | 'auto';
export type ModalPadding = 'none' | 'auto';

export class Modal {
  id: string;
  title: string;
  size: ModalSize = 'auto';
  padding: ModalPadding = 'auto';
  contents = createEl('div', { className: 'modal-contents' });
  private root?: HTMLElement;
  private modalContainer?: HTMLElement;
  private elementName?: string;
  private shortcutService =
    dependencies.resolve<ShortcutService>('ShortcutService');
  private modalService = dependencies.resolve<ModalService>('ModalService');
  private closeCallback = () => this.modalService.close(this.id);
  private handleKeyDown = this.onKeyDown.bind(this);
  private previousActiveElement: HTMLElement | null = null;

  constructor(key: string, definition: ModalDefinition) {
    this.id = key;
    this.title = definition.title;
    this.elementName = definition.element;
  }

  open(stackPosition: number) {
    // Store the currently focused element
    this.previousActiveElement = document.activeElement as HTMLElement;

    this.root = createEl('div', {
      className: 'modal-overlay',
      style: { zIndex: 300 + stackPosition },
    });

    if (this.elementName) {
      const contentsComponent = document.createElement(
        this.elementName
      ) as ModalElement;
      this.size = contentsComponent.size || 'auto';
      this.padding = contentsComponent.padding || 'auto';
      contentsComponent.addEventListener('close', this.closeCallback);
      this.contents.appendChild(contentsComponent);
    }

    render(this.template, this.root);
    document.body.appendChild(this.root);
    this.modalContainer = this.root.querySelector(
      '.modal-container'
    ) as HTMLElement;
    this.root.addEventListener('keydown', this.handleKeyDown);
    this.modalContainer.focus();

    this.root.onmousedown = (event) => {
      if (event.target === this.root) this.closeCallback();
    };

    this.shortcutService.register('Escape', this.closeCallback);
  }

  close() {
    if (this.root) {
      this.root.removeEventListener('keydown', this.handleKeyDown);
      this.root.remove();
    }

    // Restore focus to the previously active element
    if (this.previousActiveElement) {
      try {
        setTimeout(() => {
          this.previousActiveElement.focus();
        }, 0);
      } catch (e) {
        console.error('Modal: Error restoring focus:', e);
      }
    }

    this.shortcutService.deregister('Escape', this.closeCallback);
  }

  get template() {
    return html`<div
      class="modal-container"
      data-size=${this.size}
      data-padding=${this.padding}
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div class="modal-header">
        <span id="modal-title">${this.title}</span>
        <un-button
          icon="close"
          type="ghost"
          @click=${this.closeCallback}
          aria-label="Close modal"
        >
        </un-button>
      </div>
      ${this.contents}
    </div>`;
  }

  private getFocusableElements(): HTMLElement[] {
    if (!this.modalContainer) return [];

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'un-button:not([disabled])',
      'un-input:not([disabled])',
    ].join(',');

    return Array.from(
      this.modalContainer.querySelectorAll(selector)
    ) as HTMLElement[];
  }

  /**
   * Handle keydown events to trap focus within the modal
   */
  private onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}
