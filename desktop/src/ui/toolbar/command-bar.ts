import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './command-input';
import './command-bar.css';
import '../common/elements/button';
import { dependencies } from '../../common/dependencies';
import { ConfigService } from '../../config/config-service';

@customElement('command-bar')
export class CommandBar extends LitElement {
  renderRoot = this;
  configService = dependencies.resolve<ConfigService>('ConfigService');

  connectedCallback() {
    super.connectedCallback();
    this.configService.subscribe((notification) => {
      if (notification?.type === 'ui') {
        this.requestUpdate();
      }
    });
  }

  private handleSidebarToggle() {
    this.configService.toggleSidebar();
  }

  render() {
    const sidebarVisible = this.configService.get('ui').sidebarVisible;

    return html`
      <div class="left-section"></div>
      <div class="center-section">
        <command-input></command-input>
      </div>
      <div class="right-section">
        <un-button
          .icon=${'panelRight'}
          .variant=${'ghost'}
          .toggled=${sidebarVisible}
          @click=${this.handleSidebarToggle}
        ></un-button>
      </div>
    `;
  }
}
