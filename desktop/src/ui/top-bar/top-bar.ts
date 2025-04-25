import { appendEl, createEl } from '../../common/utils/dom';
import { DisposableGroup } from '../../common/disposable';
import { render, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import { dependencies } from '../../common/dependencies';
import { WorkspaceModel } from '../../workspaces';
import './tab-handle';
import './top-bar.css';
import { ModalService } from '../../modals/modal-service';

// Define electronAPI type for TypeScript
declare global {
  interface Window {
    electronAPI?: {
      onWindowStateChange: (callback: (isFullscreen: boolean) => void) => void;
      removeWindowStateListeners: () => void;
      platform: string;
      isFullScreen: () => Promise<boolean>;
    };
  }
}

// Define electronAPI type for TypeScript
declare global {
  interface Window {
    electronAPI?: {
      onWindowStateChange: (callback: (isFullscreen: boolean) => void) => void;
      removeWindowStateListeners: () => void;
      platform: string;
      isFullScreen: () => Promise<boolean>;
    };
  }
}

export class TopBar extends HTMLElement {
  modalService = dependencies.resolve<ModalService>('ModalService');
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  staticTabsContainer?: HTMLElement;
  workspaceSelectContainer?: HTMLElement;
  settingsButtonContainer?: HTMLElement;
  private disposables = new DisposableGroup();

  // TODO: Add dependency injection using decorators for model
  connectedCallback() {
    this.staticTabsContainer = appendEl(
      this,
      createEl('div', { className: 'static-tab-list' })
    );
    this.workspaceSelectContainer = appendEl(
      this,
      createEl('div', { className: 'workspace-select-container' })
    );
    this.settingsButtonContainer = appendEl(
      this,
      createEl('div', { className: 'settings-button-container' })
    );

    this.disposables.add(
      this.workspaceModel.subscribe(this.updateTabs.bind(this))
    );
    this.updateTabs();

    const isMac = window.electronAPI?.platform === 'darwin';
    this.classList.toggle('mac', isMac);
    this.initializeWindowStateListeners();
  }

  disconnectedCallback() {
    if (window.electronAPI) {
      window.electronAPI.removeWindowStateListeners();
    }
    this.disposables.dispose();
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

  openSettings() {
    this.modalService.open('settings');
  }

  updateTabs() {
    const workspaces = this.workspaceModel.all();
    const activeWorkspaceId =
      this.workspaceModel.activeWorkspaceId || (workspaces[0]?.id ?? '');

    const selectTemplate = html`
      <un-select
        variant="ghost"
        .value=${activeWorkspaceId}
        placeholder="Select workspace"
        @change=${(e: CustomEvent) => {
          const newId = e.detail.value;
          if (newId && newId !== activeWorkspaceId) {
            this.workspaceModel.setActiveWorkspace(newId);
          }
        }}
      >
        ${repeat(
          workspaces,
          (ws) => ws.id,
          (ws) => html`<option value=${ws.id}>${ws.title}</option>`
        )}
      </un-select>
    `;

    render(selectTemplate, this.workspaceSelectContainer!);

    const settingsButtonTemplate = html`
      <un-button
        type="ghost"
        icon="bug"
        class="settings-button"
        @click=${() => this.modalService.open('bug')}
      >
      </un-button>
      <un-button
        type="ghost"
        icon="settings"
        class="settings-button"
        @click=${() => this.openSettings()}
      >
      </un-button>
    `;
    render(settingsButtonTemplate, this.settingsButtonContainer!);
  }
}

customElements.define('top-bar', TopBar);
