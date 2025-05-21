import { html, render } from 'lit';
import './idle-screen.css';

export class IdleScreenElement extends HTMLElement {
  private intervalId: number | null = null;

  connectedCallback() {
    this.render();
    this.intervalId = window.setInterval(() => this.updateTime(), 1000);
  }

  disconnectedCallback() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
    }
  }

  updateTime() {
    this.render();
  }

  formatTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  formatDate() {
    const now = new Date();
    return now.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  render() {
    const template = html`
      <div class="time-container">
        <div class="time">${this.formatTime()}</div>
        <div class="date">${this.formatDate()}</div>
      </div>
    `;

    render(template, this);
  }
}

customElements.define('idle-screen', IdleScreenElement);
