import { html, render } from 'lit';
import './idle-screen';
import './workbench-view.css';
import '../processes/process-frame';
import { dependencies } from '../../common/dependencies';
import { WorkspaceService } from '../../workspaces/workspace-service';
import { WorkspaceModel } from '../../workspaces/workspace-model';
import { DisposableGroup } from '../../common/disposable';

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
    this.workspaceModel = this.workspaceService.activeWorkspaceModel;
    this.render();
  }

  updateWorkspace() {
    this.workspaceModelDisposables.dispose();
    this.workspaceModel = this.workspaceService.activeWorkspaceModel;
    this.workspaceModelDisposables.add(
      this.workspaceModel.onProcessesChanged(() => this.render())
    );
    this.render();
  }

  render() {
    console.log(this.workspaceModel.processes[0].process);
    if (this.workspaceModel.processes) {
      const template = html`<process-frame
        .process=${this.workspaceModel.processes[0].process}
      ></process-frame>`;
      render(template, this);
    } else {
      const template = html`<idle-screen></idle-screen>`;
      render(template, this);
    }
  }
}

customElements.define('workbench-view', Workbench);
