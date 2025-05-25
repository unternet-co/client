import { Process, ResourceIcon } from '@unternet/kernel';
import { getMetadata } from '../../common/utils/http';
import { WebviewTag } from 'electron/renderer';

interface WebProcessState {
  url: string;
  title?: string;
  description?: string;
  icons?: ResourceIcon[];
  textContent?: string;
  data?: any;
}

export class WebProcess extends Process {
  url: string;
  webview: WebviewTag;
  title?: string;
  description?: string;
  icons?: ResourceIcon[];
  textContent?: string;
  data?: any;

  static async create(url: string) {
    const process = new WebProcess({ url });
    const metadata = await getMetadata(url);
    process.title = metadata.title;
    process.description = metadata.description;
    process.icons = metadata.icons;
    process.textContent = metadata.textContent;
    return process;
  }

  get snapshot(): WebProcessState {
    return {
      url: this.url,
      title: this.title,
      icons: this.icons,
      description: this.description,
      textContent: this.textContent,
      data: this.data,
    };
  }

  static resume(state: WebProcessState) {
    const process = new WebProcess(state);
    process.icons = state.icons;
    process.title = state.title;
    process.data = state.data;
    return process;
  }

  constructor(state: WebProcessState) {
    super();
    this.url = state.url;
    this.webview = document.createElement('webview');
    this.webview.src = state.url;
    this.webview.style.border = 'none';
    this.webview.style.width = '100%';
    this.webview.style.height = '100%';
    this.webview.style.background = 'var(--color-bg-content)';
  }

  // async handleAction(action: ActionProposal) {
  //   const applet = await this.connectApplet(hiddenContainer);
  //   await applet.sendAction(action.actionId, action.args);
  //   this.data = applet.data;
  // }

  describe() {
    return {
      url: this.url,
      title: this.title,
      description: this.description,
      textContent: this.textContent,
      data: this.data,
    };
  }

  mount(host: HTMLElement): void | Promise<void> {
    host.appendChild(this.webview);
  }

  // unmount(): void {
  //   this.disconnectApplet();
  // }

  // async connectApplet(element: HTMLElement): Promise<Applet> {
  //   element.appendChild(this.webview);
  //   const applet = await applets.connect(this.webview.contentWindow);
  //   applet.data = this.data;
  //   return applet;
  // }

  // disconnectApplet(element?: HTMLElement) {
  //   this.webview.remove();
  // }
}

// const hiddenContainer = document.createElement('div');
// hiddenContainer.style.display = 'none';
// document.body.appendChild(hiddenContainer);
