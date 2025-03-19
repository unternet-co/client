import { tabModel } from '../../models/tabs';
import { Disposable, DisposableGroup } from '../../base/disposable';
import { clearNode } from '../../utils/dom';
import { CommandInputElement, CommandSubmitEvent } from './command-input';
import './command-input';
import './workspace.css';
import { kernel } from '../../kernel';
import { workspaceModel } from '../../models/workspaces';
import { InteractionTextOutput } from '@unternet/kernel';

// TODO: Create DisposableView class which has element & disposables already
export class WorkspaceView extends Disposable {
  element: HTMLElement;
  commandInput: CommandInputElement;
  contentContainer: HTMLElement;
  workspaceModel = workspaceModel;
  disposables = new DisposableGroup();

  // TODO: Implement dependency injection with decorators
  constructor(el: HTMLElement) {
    super();
    this.element = el;

    const template = /*html*/ `
      <div class="workspace">
        <div class="workspace-content"></div>
        <div class="command-bar">
          <command-input></command-input>
        </div>
        <div class="resource-bar"></div>
      </div>
    `;

    this.element.innerHTML = template;
    this.commandInput = document.querySelector('command-input')!;

    this.contentContainer = document.querySelector('.workspace-content')!;

    this.disposables.attachListener(
      this.commandInput,
      'submit',
      this.handleCommandSubmit.bind(this)
    );

    this.updateContent();
    this.workspaceModel.subscribe(() => this.updateContent());
  }

  updateContent() {
    this.contentContainer.innerHTML = this.workspaceModel
      .getInteractions()
      .map((interaction) => {
        return `INPUT: ${
          interaction.input.text
        }<br><br>OUTPUT:${interaction.outputs
          .map((x) => (x as InteractionTextOutput).content)
          .join('<br>')}<br><br>`;
      })
      .join('');
  }

  handleCommandSubmit(e: CommandSubmitEvent) {
    kernel.handleInput({ text: e.value });
  }

  dispose() {
    clearNode(this.element);
    super.dispose();
  }
}
