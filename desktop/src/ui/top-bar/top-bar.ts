import { DisposableGroup } from '../../common/disposable';
import { render, html } from 'lit';
import { dependencies } from '../../common/dependencies';
import { WorkspaceModel } from '../../models/workspace-model';
import '../tab-handle';
import './top-bar.css';
import { ModalService } from '../../modals/modal-service';
import '../toolbar/workspace-selector';

export class TopBar extends HTMLElement {
  modalService = dependencies.resolve<ModalService>('ModalService');
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  staticTabsContainer?: HTMLElement;
  workspaceSelectContainer?: HTMLElement;
  settingsButtonContainer?: HTMLElement;
  private disposables = new DisposableGroup();

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
    const template = html`
      <!-- <div class="workspace-select-container">
        <workspace-selector></workspace-selector>
      </div> -->
      <div class="button-container">
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
