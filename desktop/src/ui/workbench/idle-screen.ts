import { html, render } from 'lit';
import './idle-screen.css';
import './resource-bar';

export class IdleScreenElement extends HTMLElement {
  private intervalId: number | null = null;

  connectedCallback() {
    this.render();
    this.intervalId = window.setInterval(this.render.bind(this), 1000);
  }

  disconnectedCallback() {
    if (this.intervalId !== null) window.clearInterval(this.intervalId);
  }

  updateTime() {
    this.render();
  }

  render() {
    const now = new Date();

    const formattedTime = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    const formattedDate = now.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const template = html`
      <div class="time-container">
        <div class="time">${formattedTime}</div>
        <div class="date">${formattedDate}</div>
      </div>
      <resource-bar></resource-bar>
    `;

    render(template, this);
  }
}

customElements.define('idle-screen', IdleScreenElement);
