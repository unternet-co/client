import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './command-bar.css';
import { operator } from '@unternet/kernel';

@customElement('command-bar')
export class CommandBar extends LitElement {
  renderRoot = this;

  handleKeyDown(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;

    if (e.key === 'Enter') {
      e.preventDefault();
      // input.blur();
      operator.handleInput({ type: 'command', text: input.value });
      input.value = '';
    }
  }

  render() {
    return html`<div class="page">
      <div class="input-container">
        <input
          type="text"
          @keydown=${this.handleKeyDown.bind(this)}
          placeholder="Search or type command.."
          autofocus
          autocapitalize="off"
        />
      </div>
    </div>`;
  }
}
