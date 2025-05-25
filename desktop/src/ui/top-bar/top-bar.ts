import { render, html } from 'lit';
import { dependencies } from '../../common/dependencies';
// import './model-selector';
import '../tab-handle';
import '../common/components/select';
import './top-bar.css';
import { ModalService } from '../common/modals/modal-service';
import '../toolbar/workspace-selector';

export class TopBar extends HTMLElement {
  modalService = dependencies.resolve<ModalService>('ModalService');
  settingsButtonContainer?: HTMLElement;

  connectedCallback() {
    this.initializeWindowStateListeners();
    this.render();
  }

  private initializeWindowStateListeners(): void {
    if (window.electronAPI) {
      window.electronAPI
        .isFullScreen()
        .then((isFullscreen) => {
          this.toggleFullscreenClass(isFullscreen);
        })
        .catch((err) => {
          console.error('[TopBar] Error checking fullscreen state:', err);
        });

      window.electronAPI.onWindowStateChange((isFullscreen) => {
        this.toggleFullscreenClass(isFullscreen);
      });
    }
  }

  private toggleFullscreenClass(isFullscreen: boolean): void {
    if (isFullscreen) {
      this.classList.add('fullscreen');
    } else {
      this.classList.remove('fullscreen');
    }
  }

  render() {
    // Use the new <model-selector> component
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
