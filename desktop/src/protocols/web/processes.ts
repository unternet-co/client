import { Process } from '@unternet/kernel';
import { WebviewTag } from 'electron';
import iconSrc from '../builtin/icon-128x128.png';

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
    this.icons = [
      {
        src: iconSrc,
      },
    ];
    this.title = 'Web view';
    this.webview.style.height = '400px';
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
