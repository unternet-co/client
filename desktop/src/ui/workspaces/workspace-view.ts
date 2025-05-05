import { CommandSubmitEvent } from './command-input';
import './command-input';
import './thread-view';
import './workspace-view.css';
import './resource-bar';
import '../common/elements/combobox';
import { html, render } from 'lit';
import { WorkspaceRecord, WorkspaceModel } from '../../workspaces';
import { Kernel, KernelNotInitializedError } from '../../ai/kernel';
import { dependencies } from '../../common/dependencies';
import { ModalService } from '../../modals/modal-service';
import { ResourceModel } from '../../protocols/resources';

export class WorkspaceView extends HTMLElement {
  constructor() {
    super();
    this.monitorCommandInput = this.monitorCommandInput.bind(this);
    this.openToolsMenu = this.openToolsMenu.bind(this);
    this.closeToolsMenu = this.closeToolsMenu.bind(this);
    this.appendSpace = this.appendSpace.bind(this);
    this.captureSearchString = this.captureSearchString.bind(this);
  }
  private _workspaceId: WorkspaceRecord['id'];
  private workspaceModel: WorkspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private resourceModel = dependencies.resolve<ResourceModel>('ResourceModel');
  private visibilityObserver: IntersectionObserver;
  private isToolsMenuOpen = false;
  private searchString = '';

  set workspaceId(id: WorkspaceRecord['id']) {
    if (this._workspaceId !== id) {
      this._workspaceId = id;
      render(this.template, this);
      setTimeout(() => this.focusCommandInput(), 0);
    }
  }
  get workspaceId() {
    return this._workspaceId;
  }
  kernel = dependencies.resolve<Kernel>('Kernel');
  static get observedAttributes() {
    return ['for'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'for' && oldValue !== newValue) {
      this.workspaceId = newValue || '';
    }
  }

  // TODO: Implement dependency injection with decorators
  connectedCallback() {
    this.workspaceId = this.getAttribute('for') || '';

    // Set up visibility observer to focus when tab is switched back to this view
    this.setupVisibilityObserver();
    // Wait for the DOM to be ready before setting up the input listener
    requestAnimationFrame(() => this.setupInputListener());
  }

  disconnectedCallback() {
    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
    }
  }

  private setupInputListener() {
    const inputDiv = this.getCommandInput();
    inputDiv.addEventListener('input', this.monitorCommandInput);
  }

  private focusCommandInput() {
    const commandInput = this.querySelector(
      'command-input'
    ) as HTMLInputElement;
    commandInput.focus();
  }

  private setupVisibilityObserver() {
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          this.focusCommandInput();
        }
      },
      { threshold: [0.5] }
    );

    this.visibilityObserver.observe(this);
  }

  async handleCommandSubmit(e: CommandSubmitEvent) {
    if (this.getInputContent().trim().length === 0) return;
    try {
      await this.kernel.handleInput(this.workspaceId, e.input);
    } catch (error) {
      console.error('Error handling command input:', error);

      if (error instanceof KernelNotInitializedError) {
        const modalService = dependencies.resolve<ModalService>('ModalService');
        modalService.open('settings');
      }
    }
  }

  private handleArchive = () => {
    const ws = this.workspaceModel.get(this.workspaceId);
    if (!ws) return;
    this.workspaceModel.archiveMessages();
    this.workspaceModel.setArchiveVisibility(!ws.showArchived);
  };

  get toolsMenuOptions() {
    return this.resourceModel
      .all()
      .map((resource) => ({
        label: resource.name.toLowerCase(),
        value: resource.name.toLowerCase(),
      }))
      .concat([
        { label: 'calculator', value: 'calculator' },
        { label: 'maps', value: 'maps' },
      ]);
  }

  getCommandInput() {
    const commandInput = this.querySelector('command-input');
    const shadowRoot = commandInput.shadowRoot;
    const commandInputDiv = shadowRoot.querySelector(
      '.command-input'
    ) as HTMLElement;
    return commandInputDiv;
  }

  appendSpace() {
    const commandInputDiv = this.getCommandInput();
    const spaceNode = document.createTextNode('\u00A0');
    commandInputDiv.appendChild(spaceNode);
  }

  getInputContent() {
    const commandInputDiv = this.getCommandInput();
    return commandInputDiv.innerText;
  }

  normalizeInputContent(inputContent: string) {
    // Normalize the input content by replacing non-breaking spaces with regular spaces
    return inputContent.replace(/[\u00A0\u200B]/g, ' ');
  }

  shouldOpenToolsMenu() {
    const inputContent = this.normalizeInputContent(this.getInputContent());
    // Return true if the input is empty, ends with a space, or ends with a newline
    return (
      inputContent.length === 0 ||
      inputContent.endsWith(' ') ||
      inputContent.endsWith('\n')
    );
  }

  captureSearchString(e: KeyboardEvent) {
    if (e.key === 'Backspace' && e.metaKey) {
      // deletes everything in the input
      this.searchString = '';
      this.closeToolsMenu();
    } else if (e.key === 'Backspace') {
      this.searchString = this.searchString.slice(0, -1);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.searchString += e.key;
    }

    render(this.template, this);
  }

  openToolsMenu() {
    if (this.shouldOpenToolsMenu()) {
      this.isToolsMenuOpen = true;
      setTimeout(() => {
        document.addEventListener('keydown', this.captureSearchString);
      }, 0);
      render(this.template, this);
    }
  }

  closeToolsMenu() {
    this.isToolsMenuOpen = false;
    this.searchString = '';
    document.removeEventListener('keydown', this.captureSearchString);
    render(this.template, this);
  }

  setCaretToEnd() {
    const commandInputDiv = this.getCommandInput();
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(commandInputDiv);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  selectTool(tool: string) {
    const commandInputDiv = this.getCommandInput();
    const inputContent = this.getInputContent();
    const index = inputContent.lastIndexOf(this.searchString);
    // Remove search query from input before appending the selected tool
    commandInputDiv.innerText = inputContent.slice(0, index);
    // Append the selected tool
    commandInputDiv.appendChild(document.createTextNode(tool));
    this.appendSpace();
    this.setCaretToEnd();
    this.closeToolsMenu();
    render(this.template, this);
  }

  isInputEmpty() {
    // Remove Chromium-injected invisible characters and structural whitespace
    const cleanedInputContent = this.getInputContent().replace(
      /[\u200B\u00A0\n\r]/g,
      ''
    );
    return cleanedInputContent.length === 0;
  }

  monitorCommandInput() {
    // Close the tools menu if the input content is empty
    if (this.isInputEmpty()) {
      this.closeToolsMenu();
      render(this.template, this);
    }
  }

  get template() {
    return html`
      <!-- <div class="workspace-toolbar">
        <un-button
          class="archive-button"
          type="ghost"
          size="small"
          icon="archive"
          @click=${this.handleArchive}
        >Archive</un-button>
      </div> -->
      <div class="workspace-content">
        <thread-view for=${this.workspaceId}></thread-view>
      </div>
      <div class="bottom-bar">
        <div class="tools-menu ${this.isToolsMenuOpen ? 'visible' : 'hidden'}">
          <un-combobox
            class="combobox"
            .options=${this.toolsMenuOptions}
            .visible=${this.isToolsMenuOpen}
            @select=${(e) => {
              console.log('Selected:', e.input.text);
              this.selectTool(e.input.text);
            }}
            @close=${this.closeToolsMenu}
            @space=${this.appendSpace}
            .searchString=${this.searchString}
          ></un-combobox>
        </div>
        <div class="command-bar">
          <command-input
            @submit=${this.handleCommandSubmit.bind(this)}
            @open=${this.openToolsMenu}
          ></command-input>
          <un-button
            class="archive-button"
            type="ghost"
            icon="archive"
            @click=${this.handleArchive}
          ></un-button>
        </div>
        <resource-bar for=${this.workspaceId}></resource-bar>
      </div>
    `;
  }
}

customElements.define('workspace-view', WorkspaceView);
