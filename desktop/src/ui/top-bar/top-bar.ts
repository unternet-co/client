import { render, html } from 'lit';
import { dependencies } from '../../common/dependencies';
// import './model-selector';
import '../tab-handle';
import '../common/elements/select';
import './top-bar.css';
import { ModalService } from '../common/modals/modal-service';
import '../toolbar/workspace-selector';

export class TopBar extends HTMLElement {
  modalService = dependencies.resolve<ModalService>('ModalService');
  settingsButtonContainer?: HTMLElement;

  connectedCallback() {
    this.createListeners();
    this.render();
  }

  private createListeners(): void {
    window.electronAPI.isFullScreen().then(this.setFullScreen.bind(this));
    window.electronAPI.onWindowStateChange(this.setFullScreen.bind(this));
  }

  private setFullScreen(value: boolean): void {
    value
      ? this.classList.add('fullscreen')
      : this.classList.remove('fullscreen');
  }

  render() {
    const template = html`
      <div class="button-container">
        <!-- <model-selector></model-selector> -->
        <un-button
          variant="ghost"
          icon="bug"
          class="settings-button"
          @click=${() => this.modalService.open('bug')}
        >
        </un-button>
        <un-button
          variant="ghost"
          icon="settings"
          class="settings-button"
          @click=${() => this.modalService.open('settings')}
        >
        </un-button>
        <div></div>
      </div>
    `;

    render(template, this);
  }
}

customElements.define('top-bar', TopBar);
