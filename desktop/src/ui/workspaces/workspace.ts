import { tabStore } from '../../models/tabs';
import { Disposable, DisposableGroup } from '../../utils/disposable';
import { clearNode } from '../../utils/dom';
import './workspace.css';

export class WorkspaceView extends Disposable {
  element: HTMLElement;
  disposables = new DisposableGroup();

  constructor(el: HTMLElement) {
    super();
    this.element = el;

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
    super.dispose();
  }
}
