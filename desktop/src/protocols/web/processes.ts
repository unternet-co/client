import { ActionProposal, Process } from '@unternet/kernel';
import { WebviewTag } from 'electron';
import iconSrc from '../builtin/icon-128x128.png';
import { Applet, applets } from '@web-applets/sdk';

interface WebProcessInit {
  url: string;
  hiddenContainer: HTMLElement;
}

interface WebProcessState {
  url: string;
  title?: string;
  description?: string;
  data?: any;
}

export class WebProcess extends Process {
  url: string;
  hiddenContainer: HTMLElement;
  title: string;
  description: string;
  // webview: WebviewTag;
  data: any;
  webview: HTMLIFrameElement;

  constructor({ url, data }: WebProcessState) {
    super();
    this.url = url;
    this.data = data;

    this.webview = document.createElement('iframe');
    this.webview.src = url;
    this.icons = [
      {
        src: iconSrc,
      },
    ];
    this.title = 'Web view';
    this.webview.style.height = '400px';
    this.webview.style.border = 'none';
    this.webview.style.width = '100%';
    this.webview.style.background = 'white';
  }

  static spawn({ url, hiddenContainer }: WebProcessInit) {
    const process = new WebProcess({ url });
    process.hiddenContainer = hiddenContainer;
    return process;
  }

  async handleAction(action: ActionProposal) {
    const applet = await this.connectApplet(this.hiddenContainer);
    this.data = applet.data;
    this.disconnectApplet(this.hiddenContainer);
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
      console.log(this.webview.contentWindow);
      const applet = await applets.connect(this.webview.contentWindow);
      console.log('setting data', this.data);
      applet.data = this.data;
    }, 10);
    // this.connectApplet(host);
  }

  async connectApplet(element: HTMLElement): Promise<Applet> {
    element.appendChild(this.webview);
    console.log(this.webview.contentWindow);
    const applet = await applets.connect(this.webview.contentWindow);
    console.log('setting data', this.data);
    applet.data = this.data;
    return applet;
  }

  disconnectApplet(element?: HTMLElement) {
    this.webview.remove();
  }

  unmount(): void {
    this.disconnectApplet();
  }

  static hydrate(state: WebProcessState) {
    return new WebProcess(state);
  }

  serialize(): WebProcessState {
    return { url: this.url, data: this.data };
  }
}
