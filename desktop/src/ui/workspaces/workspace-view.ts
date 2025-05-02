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
    this.openToolsMenu = this.openToolsMenu.bind(this);
    this.closeToolsMenu = this.closeToolsMenu.bind(this);
  }
  private _workspaceId: WorkspaceRecord['id'];
  private workspaceModel: WorkspaceModel =
    dependencies.resolve<WorkspaceModel>('WorkspaceModel');
  private resourceModel = dependencies.resolve<ResourceModel>('ResourceModel');
  private visibilityObserver: IntersectionObserver;
  private isToolsMenuOpen = false;

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
  }

  disconnectedCallback() {
    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
    }
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
        value: resource.name,
      }))
      .concat([
        { label: 'calculator', value: 'Calculator' },
        { label: 'maps', value: 'Maps' },
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
    // Normalize the input content by replaceing non-breaking spaces with regular spaces
    return inputContent.replace(/\u00A0/g, ' ');
  }

  isBeginningOfInput(inputContent: string) {
    return inputContent.length === 0;
  }

  isAfterSpace(inputContent: string) {
    return inputContent.endsWith(' ');
  }

  isAfterNewline(inputContent: string) {
    return inputContent.endsWith('\n');
  }

  shouldOpenToolsMenu() {
    const inputContent = this.normalizeInputContent(this.getInputContent());
    return (
      this.isBeginningOfInput(inputContent) ||
      this.isAfterSpace(inputContent) ||
      this.isAfterNewline(inputContent)
    );
  }

  openToolsMenu() {
    if (this.shouldOpenToolsMenu()) {
      this.isToolsMenuOpen = true;
      render(this.template, this);
    }
  }

  closeToolsMenu() {
    this.isToolsMenuOpen = false;
    render(this.template, this);
  }

  selectTool(tool: string) {
    const commandInput = this.querySelector('command-input') as HTMLElement;
    const shadowRoot = commandInput.shadowRoot;
    const commandInputDiv = shadowRoot.querySelector('.command-input');
    // Append the selected tool
    commandInputDiv.innerHTML += `${tool}`;

    // Manually Reset cursor to end of command input
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(commandInputDiv);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    // Close the tools menu
    this.isToolsMenuOpen = false;
    render(this.template, this);
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
            @select=${(e) => {
              console.log('Selected:', e.input.text);
              this.selectTool(e.input.text);
            }}
            @close=${this.closeToolsMenu}
            @space=${this.appendSpace}
            searchString=""
            selectedValue=${this.toolsMenuOptions[0].value}
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
