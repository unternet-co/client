import { tabStore } from '../../models/tabs';
import { DisposableGroup, IDisposable } from '../../base/disposable';
import { clearNode } from '../../utils/dom';
import './workspace.css';

export class WorkspaceView implements IDisposable {
  element: HTMLElement;
  disposed: boolean = false;
  disposables = new DisposableGroup();

  constructor(el: HTMLElement) {
    this.element = el;
    this.disposed;

    const template = /*html*/ `
      <div class="workspace">
        <div class="workspace-content">
          ${tabStore.activeTab?.id}
        </div>
        <command-bar></command-bar>
        <resource-bar></resource-bar>
      </div>
    `;

    this.element.innerHTML = template;
  }

  dispose() {
    clearNode(this.element);
    this.disposables.dispose();
    this.disposed = true;
  }
}
