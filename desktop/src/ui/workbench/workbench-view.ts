import { html, render } from 'lit';
import './idle-screen';
import './workbench-view.css';
import '../processes/process-frame';
import { dependencies } from '../../common/dependencies';
import { WorkspaceService } from '../../workspaces/workspace-service';
import { WorkspaceModel } from '../../workspaces/workspace-model';
import { DisposableGroup } from '../../common/disposable';
import '../tab-bar/tab-bar';

class Workbench extends HTMLElement {
  private workspaceModel: WorkspaceModel;
  private workspaceService =
    dependencies.resolve<WorkspaceService>('WorkspaceService');
  private workspaceModelDisposables = new DisposableGroup();

  constructor() {
    super();
    this.workspaceService.onActivateWorkspace(this.updateWorkspace.bind(this));
  }

  connectedCallback() {
    this.updateWorkspace();
    this.render();
  }

  updateWorkspace() {
    this.workspaceModelDisposables.dispose();
    this.workspaceModel = this.workspaceService.activeWorkspaceModel;
    const subscription = this.workspaceModel.onProcessesChanged(() =>
      this.render()
    );
    this.workspaceModelDisposables.add(subscription);
    this.render();
  }

  get isIdle() {
    return !this.workspaceModel.processInstances.length;
  }

  render() {
    let inner;

    if (this.isIdle) {
      inner = html`<idle-screen></idle-screen>`;
    } else {
      inner = html`
        <process-frame
          .process=${this.workspaceModel.processInstances.at(-1).process}
        ></process-frame>
      `;
    }

    const template = html`
      <tab-bar></tab-bar>
      ${inner}
    `;

    render(template, this);
  }
}

customElements.define('workbench-view', Workbench);
