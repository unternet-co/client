import { Process, Protocol } from '@unternet/kernel';

interface WebProcessState {
  url: string;
}

export class WebProcess extends Process {
  url: string;
  title: string;
  description: string;

  constructor({ url }: WebProcessState) {
    super();
    this.url = url;
  }

  describe() {
    return {
      url: this.url,
      title: this.title,
      description: this.description,
    };
  }

  render(element: HTMLElement): void | Promise<void> {
    element.innerHTML = `
      <webview src="${this.url}"></webview>
    `;
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
