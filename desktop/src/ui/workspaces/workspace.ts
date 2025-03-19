import { tabModel } from '../../models/tabs';
import { Disposable, DisposableGroup } from '../../base/disposable';
import { clearNode } from '../../utils/dom';
import './command-input';
import './workspace.css';
import { CommandInputElement, CommandSubmitEvent } from './command-input';

// TODO: Create DisposableView class which has element & disposables already
export class WorkspaceView extends Disposable {
  element: HTMLElement;
  commandInput: CommandInputElement;
  disposables = new DisposableGroup();

  constructor(el: HTMLElement) {
    super();
    this.element = el;

    const template = /*html*/ `
      <div class="workspace">
        <div class="workspace-content">
          ${tabModel.activeTab?.id}
        </div>
        <div class="command-bar">
          <command-input></command-input>
        </div>
        <div class="resource-bar"></div>
      </div>
    `;

    this.element.innerHTML = template;
    this.commandInput = document.querySelector('command-input')!;

    this.disposables.attachListener(
      this.commandInput,
      'submit',
      this.handleCommandSubmit.bind(this)
    );
  }

  handleCommandSubmit(e: CommandSubmitEvent) {
    console.log(e.value);
  }

  dispose() {
    clearNode(this.element);
    super.dispose();
  }
}
