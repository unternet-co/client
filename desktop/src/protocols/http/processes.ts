import { ActionProposal, Process, ResourceIcon } from '@unternet/kernel';
import { getMetadata } from '../../common/utils/http';
import { WebviewTag } from 'electron/renderer';
import { Applet, applets } from '@web-applets/sdk';

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

  static create(url: string) {
    const process = new WebProcess({ url });
    process.load(url);
    return process;
  }

  async load(url: string) {
    const metadata = await getMetadata(url);
    this.title = metadata.title;
    this.description = metadata.description;
    this.icons = metadata.icons;
    this.textContent = metadata.textContent;
    console.log('updated');
    console.log(this);
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
      // const applet = await this.connectApplet(hiddenContainer);
      return;
    }
    await this.applet.sendAction(action.actionId, action.args);
    this.data = this.applet.data;
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
      console.log('ACTIONS', this.actions);
    }, 0);
  }

  unmount(): void {
    this.webview.remove();
  }

  // async connectApplet(element: HTMLElement): Promise<Applet> {
  //   element.appendChild(this.webview);
  //   const applet = await applets.connect(this.webview.contentWindow);
  //   applet.data = this.data;
  //   return applet;
  // }
}

// const hiddenContainer = document.createElement('div');
// hiddenContainer.style.display = 'none';
// document.body.appendChild(hiddenContainer);
