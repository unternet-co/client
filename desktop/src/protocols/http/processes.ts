import { ActionProposal, Process, ResourceIcon } from '@unternet/kernel';
import { getMetadata } from '../../common/utils/http';
import { WebviewTag } from 'electron/renderer';
import { Applet, applets } from '@web-applets/sdk';

const hiddenContainer = document.createElement('div');
hiddenContainer.style.display = 'none';
document.body.appendChild(hiddenContainer);

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
  webview: HTMLIFrameElement | WebviewTag;
  title?: string;
  description?: string;
  icons?: ResourceIcon[];
  textContent?: string;
  data?: any;
  applet?: Applet | null;

  static async create(url: string) {
    const process = new WebProcess({ url });
    await process.load(url);
    return process;
  }

  async load(url: string) {
    const metadata = await getMetadata(url);
    this.title = metadata.title;
    this.description = metadata.description;
    this.icons = metadata.icons;
    this.textContent = metadata.textContent;
    if (this.url.includes('applets.unternet')) {
      this.applet = await this.connectApplet(hiddenContainer);
    }
    this.notifyChange();
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
    if (this.url.includes('applets.unternet')) {
      this.webview = document.createElement('iframe');
    } else {
      this.webview = document.createElement('webview');
    }
    this.webview.src = state.url;
    this.webview.style.border = 'none';
    this.webview.style.width = '100%';
    this.webview.style.height = '100%';
    this.webview.style.background = 'var(--color-surface)';
  }

  async handleAction(action: ActionProposal) {
    if (!this.applet) {
      return;
    }
    setTimeout(async () => {
      console.log('Applet:', this.applet);
      console.log('Handling action:', action);
      await this.applet.sendAction(action.actionId, action.args);
      console.log('Action sent to applet:', action.actionId, action.args);
      this.data = this.applet.data;
    }, 500);
  }

  describe() {
    return {
      url: this.url,
      title: this.title,
      description: this.description,
      textContent: this.textContent,
      data: this.data,
    };
  }

  async mount(host: HTMLElement): Promise<void> {
    host.appendChild(this.webview);
    setTimeout(async () => {
      this.applet = await applets.connect(
        (this.webview as HTMLIFrameElement).contentWindow
      );
      this.actions = this.applet?.actions;
    }, 0);
  }

  unmount(): void {
    this.webview.remove();
  }

  async connectApplet(element: HTMLElement): Promise<Applet> {
    console.log('connecting applet');
    const webview = this.webview as HTMLIFrameElement;
    element.appendChild(webview);
    const applet = await applets.connect(webview.contentWindow);
    applet.data = this.data;
    console.log('apoplet connected', applet);
    return applet;
  }
}
