import { ActionProposal, Process, ResourceIcon } from '@unternet/kernel';
import { WebviewTag } from 'electron';
import iconSrc from '../builtin/icon-128x128.png';
import { Applet, applets } from '@web-applets/sdk';
import { getMetadata } from '../../common/utils/http';

interface WebProcessState {
  url: string;
  title?: string;
  description?: string;
  icons?: ResourceIcon[];
  data?: any;
}

// TODO: Put this somewhere better?
const hiddenContainer = document.createElement('div');
hiddenContainer.style.display = 'none';
document.body.appendChild(hiddenContainer);

export class WebProcess extends Process {
  url: string;
  webview: HTMLIFrameElement; // TODO: WebviewTag
  title?: string;
  description?: string;
  icons?: ResourceIcon[];
  data?: any;

  static async create(url: string) {
    const process = new WebProcess({ url });
    const metadata = await getMetadata(url);
    process.title = metadata.title;
    process.description = metadata.description;
    process.icons = metadata.icons;
    return process;
  }

  static resume(state: WebProcessState) {
    const process = new WebProcess(state);
    process.data = state.data;
    return process;
  }

  constructor(state: WebProcessState) {
    super();
    this.url = state.url;
    this.webview = document.createElement('iframe');
    this.webview.src = state.url;
    this.icons = [
      {
        src: iconSrc,
      },
    ];
    this.title = 'Web view';
    this.webview.style.height = '400px';
    this.webview.style.border = 'none';
    this.webview.style.width = '100%';
    this.webview.style.background = 'var(--color-bg-content)';
  }

  async handleAction(action: ActionProposal) {
    const applet = await this.connectApplet(hiddenContainer);
    await applet.sendAction(action.actionId, action.args);
    this.data = applet.data;
    this.disconnectApplet(hiddenContainer);
  }

  describe() {
    return {
      url: this.url,
      title: this.title,
      description: this.description,
      data: this.data,
    };
  }

  mount(host: HTMLElement): void | Promise<void> {
    host.appendChild(this.webview);
    setTimeout(async () => {
      const applet = await applets.connect(this.webview.contentWindow);
      applet.data = this.data;
    }, 10);
    // this.connectApplet(host);
  }

  unmount(): void {
    this.disconnectApplet();
  }

  async connectApplet(element: HTMLElement): Promise<Applet> {
    element.appendChild(this.webview);
    const applet = await applets.connect(this.webview.contentWindow);
    applet.data = this.data;
    return applet;
  }

  disconnectApplet(element?: HTMLElement) {
    this.webview.remove();
  }

  get snapshot(): WebProcessState {
    return {
      url: this.url,
      data: this.data,
      title: this.title,
      description: this.description,
      icons: this.icons,
    };
  }
}
