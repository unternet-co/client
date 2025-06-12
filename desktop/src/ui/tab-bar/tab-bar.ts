import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './tab-handle';
import './tab-bar.css';
import { Tab } from './types';
import { dependencies } from '../../common/dependencies';
import { WorkspaceService } from '../../workspaces/workspace-service';
import { WorkspaceModel } from '../../workspaces/workspace-model';
import { getResourceIcon } from '../../common/utils';
import { DisposableGroup } from '../../common/disposable';

@customElement('tab-bar')
export class TabBar extends LitElement {
  renderRoot = this;
  @state() accessor tabs: Tab[] = [];
  @state() accessor workspaceModel: WorkspaceModel;
  @state() accessor selectedTabIndex: number = 0;
  private disposables = new DisposableGroup();
  private workspaceService =
    dependencies.resolve<WorkspaceService>('WorkspaceService');

  connectedCallback() {
    super.connectedCallback();

    // Listen for workspace changes
    this.workspaceService
      .onActivateWorkspace(() => {
        this.setWorkspaceModel();
      })
      .bind(this.disposables);

    this.setWorkspaceModel();
  }

  setWorkspaceModel() {
    this.workspaceModel = this.workspaceService.activeWorkspaceModel;
    this.updateTabs();

    this.selectedTabIndex = this.workspaceModel.selectedTabIndex;

    // Listen for process changes
    this.workspaceModel
      .onProcessesChanged(() => {
        this.updateTabs();
      })
      .bind(this.disposables);

    // Listen for metadata changes (including selectedTabIndex)
    this.workspaceModel
      .onMetadataChanged((notification) => {
        this.selectedTabIndex = notification.selectedTabIndex;
      })
      .bind(this.disposables);
  }

  updateTabs() {
    this.tabs = this.workspaceModel.processInstances.map((instance) => ({
      title: this.truncateTitle(instance.process?.title || 'Untitled'),
      icon: getResourceIcon(instance.process) || undefined,
    }));
  }

  private truncateTitle(title: string, maxLength: number = 20): string {
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength - 3) + '...';
  }

  handleSelectTab(index: number) {
    this.workspaceModel.setSelectedTabIndex(index);
    this.selectedTabIndex = index;
  }

  handleHomeClick() {
    this.workspaceModel.setSelectedTabIndex(-1);
    this.selectedTabIndex = -1;
  }

  render() {
    return html`
      <un-button
        .icon=${'home'}
        .variant=${'ghost'}
        .iconSize=${'medium'}
        @click=${this.handleHomeClick}
        ?selected=${this.selectedTabIndex === -1}
      ></un-button>
      ${this.tabs.map(
        (tab, index) => html`
          <tab-handle
            .tab=${tab}
            @select=${() => this.handleSelectTab(index)}
            ?selected=${index === this.selectedTabIndex}
          ></tab-handle>
        `
      )}
    `;
  }
}
