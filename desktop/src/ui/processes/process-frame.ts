import { Process, ProcessContainer } from '@unternet/kernel';
import { guard } from 'lit/directives/guard.js';
import './process-frame.css';
import './process-view';
import { getResourceIcon } from '../../common/utils';
import { html, HTMLTemplateResult, render } from 'lit';
import { dependencies } from '../../common/dependencies';
import { ProcessService } from '../../processes/process-service';
import { WorkspaceService } from '../../workspaces/workspace-service';
import { WorkspaceModel } from '../../workspaces/workspace-model';
import { Disposable } from '../../common/disposable';

/**
 * Custom element that displays a process container with its icon, title, and status.
 *
 * @element process-frame
 * @attr {boolean} noheader - When present, hides the process header
 */
class ProcessFrame extends HTMLElement {
  private workspaceService =
    dependencies.resolve<WorkspaceService>('WorkspaceService');
  private workspaceModel: WorkspaceModel;
  private _process: ProcessContainer;
  private processListener = new Disposable();

  constructor() {
    super();
    this.updateWorkspaceModel();
    this.workspaceService.onActivateWorkspace(
      this.updateWorkspaceModel.bind(this)
    );
  }

  updateWorkspaceModel() {
    this.workspaceModel = this.workspaceService.activeWorkspaceModel;
  }

  /**
   * Sets the process to be displayed and renders it
   * @param {ProcessContainer} process - The process container to render
   */
  set process(process: ProcessContainer) {
    this._process = process;
    this.processListener.dispose();
    this.processListener = new Disposable(
      process.on('processchanged', () => this.render())
    );
    this.render();
  }
  get process() {
    return this._process;
  }

  private handleResume(process: ProcessContainer) {
    process.resume();
    this.render();
  }

  private close() {
    this.workspaceModel.closeProcessInstance(this.process.pid);
  }

  private render() {
    const process = this.process;
    const iconSrc = getResourceIcon(process);
    const isHeaderVisible = this.getAttribute('noheader') === null;
    const iconTemplate = html`<img src=${iconSrc} />`;

    let bodyTemplate: HTMLTemplateResult;

    if (process.status === 'running') {
      bodyTemplate = html`<process-view .process=${process}></process-view>`;
    } else {
      bodyTemplate = html`<button @click=${() => this.handleResume(process)}>
        Click to resume
      </button>`;
    }

    const header = html`<div class="process-header">
      <div class="title">${iconTemplate} ${process.title}</div>
      <div class="controls">
        <un-icon name="x" @click=${this.close.bind(this)}></un-icon>
      </div>
    </div>`;

    const template = html`${isHeaderVisible ? header : null} ${bodyTemplate}`;

    render(template, this);
  }
}

customElements.define('process-frame', ProcessFrame);
