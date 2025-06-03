import { html, render } from 'lit';
import './common/styles/global.css';
import './app-root.css';
import './toolbar/command-bar';
import './common/elements';
import './thread/thread-sidebar';
import './thread/thread-overlay';
import './workbench/workbench-view';
import { dependencies } from '../common/dependencies';
import { WorkspaceService } from '../workspaces/workspace-service';
import { ConfigService } from '../config/config-service';

export class AppRoot extends HTMLElement {
  workspaceService = dependencies.resolve<WorkspaceService>('WorkspaceService');
  configService = dependencies.resolve<ConfigService>('ConfigService');

  connectedCallback() {
    this.workspaceService.onActivateWorkspace(this.update.bind(this));
    this.configService.subscribe((notification) => {
      console.log('App root received config notification:', notification);
      if (notification?.type === 'ui') {
        console.log('UI notification received, updating app');
        this.update();
      }
    });
    this.update();
  }

  update() {
    const ws = this.workspaceService.activeWorkspaceModel;
    if (!ws) return;

    const sidebarVisible = this.configService.get('ui').sidebarVisible;

    const template = html`
      <div class="workspace-content">
        <workbench-view></workbench-view>
        <thread-overlay ?hidden=${sidebarVisible}></thread-overlay>
        <thread-sidebar ?hidden=${!sidebarVisible}></thread-sidebar>
      </div>
      <command-bar></command-bar>
    `;

    render(template, this);
  }
}

customElements.define('app-root', AppRoot);
