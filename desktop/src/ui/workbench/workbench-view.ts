import { html, HTMLTemplateResult, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import './idle-screen';
import './workbench-view.css';
import '../processes/process-frame';
import { dependencies } from '../../common/dependencies';
import { WorkspaceService } from '../../workspaces/workspace-service';
import { WorkspaceModel } from '../../workspaces/workspace-model';
import { DisposableGroup } from '../../common/disposable';
import '../tab-bar/tab-bar';

@customElement('workbench-view')
class Workbench extends LitElement {
  renderRoot = this;

  @state() private accessor workspaceModel: WorkspaceModel;
  @state() private accessor selectedTabIndex: number = 0;

  private workspaceService =
    dependencies.resolve<WorkspaceService>('WorkspaceService');
  private workspaceModelDisposables = new DisposableGroup();

  constructor() {
    super();
    this.workspaceService.onActivateWorkspace(this.updateWorkspace.bind(this));
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateWorkspace();
  }
  updateWorkspace() {
    this.workspaceModelDisposables.dispose();
    this.workspaceModel = this.workspaceService.activeWorkspaceModel;

    // Only update when processes are actually added/removed, not just changed
    this.workspaceModel
      .onProcessesChanged(() => {
        // Only trigger update if the number of processes changed
        this.requestUpdate();
      })
      .bind(this.workspaceModelDisposables);

    this.workspaceModel
      .onMetadataChanged((notification) => {
        this.selectedTabIndex = notification.selectedTabIndex;
      })
      .bind(this.workspaceModelDisposables);

    // Initialize selectedTabIndex from workspace model
    this.selectedTabIndex = this.workspaceModel.selectedTabIndex;
  }

  get isIdle() {
    return (
      !this.workspaceModel.processInstances.length ||
      this.selectedTabIndex === -1
    );
  }

  render() {
    const showingHome = this.selectedTabIndex === -1;
    const slidePosition = showingHome ? 0 : this.selectedTabIndex;

    return html`
      <tab-bar></tab-bar>
      <div class="workbench-content">
        <div
          class="workbench-slider"
          style="transform: translateX(${slidePosition * -100}%)"
          ?data-home-active=${showingHome}
        >
          ${repeat(
            this.workspaceModel.processInstances,
            (instance) => instance.pid,
            (instance) => html`
              <div class="workbench-slide">
                <process-frame .process=${instance.process}></process-frame>
              </div>
            `
          )}
        </div>

        <!-- Home screen overlay -->
        <div class="workbench-home-overlay" ?data-visible=${showingHome}>
          <idle-screen></idle-screen>
        </div>
      </div>
    `;
  }
}
