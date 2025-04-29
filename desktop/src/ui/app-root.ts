import { appendEl, createEl } from '../common/utils/dom';
import { html, render } from 'lit';
import './top-bar/top-bar';
import './workspaces/workspace-view';
import './app-root.css';
import { dependencies } from '../common/dependencies';
import { WorkspaceModel } from '../workspaces';

export class AppRoot extends HTMLElement {
  private contentEl: HTMLElement;
  workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private disposables: Array<{ dispose: () => void }> = [];

  connectedCallback() {
    appendEl(this, createEl('top-bar'));
    this.contentEl = appendEl(this, createEl('div', { className: 'contents' }));
    this.disposables.push(
      this.workspaceModel.subscribe(this.updateContents.bind(this))
    );
    this.updateContents();
  }

  updateContents() {
    const ws = this.workspaceModel.activeWorkspace;
    if (!ws) return;
    render(
      html`<workspace-view .key=${ws.id} for=${ws.id} active></workspace-view>`,
      this.contentEl
    );
  }

  disconnectedCallback() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}

customElements.define('app-root', AppRoot);
