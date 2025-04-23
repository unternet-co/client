import { Process, Protocol } from '@unternet/kernel';
import { WebviewTag } from 'electron';

interface WebProcessState {
  url: string;
  title?: string;
  description?: string;
}

export class WebProcess extends Process {
  url: string;
  title: string;
  description: string;
  webview: WebviewTag;

  constructor({ url }: WebProcessState) {
    super();
    this.url = url;
    this.webview = document.createElement('webview');
    this.webview.src = url;
    this.title = this.webview.getTitle();
    console.log(this.webview.getHTML());
  }

  describe() {
    return {
      url: this.url,
      title: this.title,
      description: this.description,
    };
  }

  mount(host: HTMLElement): void | Promise<void> {
    host.appendChild(this.webview);
  }

  unmount(): void {
    this.webview.remove();
  }

  static hydrate(state: WebProcessState) {
    return new WebProcess(state);
  }

  serialize(): WebProcessState {
    return { url: this.url };
  }
}

export class WebProtocol extends Protocol {
  protocol = ['http', 'https'];
}

const webProtocol = new WebProtocol();
webProtocol.registerProcess(WebProcess);

export { webProtocol };
