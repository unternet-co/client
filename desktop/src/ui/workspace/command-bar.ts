import { appendEl, createEl } from '../../utils/dom';
import './command-bar.css';

class CommandBar extends HTMLElement {
  private input: HTMLInputElement;

  constructor() {
    super();
    this.input = appendEl(
      this,
      createEl('input', { className: 'command-input' })
    ) as HTMLInputElement;
    this.input.placeholder = 'Search or type a command...';
  }
}

customElements.define('command-bar', CommandBar);
