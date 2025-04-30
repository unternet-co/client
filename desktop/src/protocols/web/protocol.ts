import { ActionProposal, Protocol } from '@unternet/kernel';
import { WebProcess } from './processes';

export class WebProtocol extends Protocol {
  scheme = ['http', 'https'];
  hiddenContainer = document.createElement('div');

  constructor() {
    super();
    this.hiddenContainer.style.display = 'none';
    document.body.appendChild(this.hiddenContainer);
  }

  async handleAction(action: ActionProposal) {
    const process = new WebProcess({
      url: action.uri,
      hiddenContainer: this.hiddenContainer,
    });
    await process.handleAction(action);
    return process;
  }
}

const webProtocol = new WebProtocol();
webProtocol.registerProcess(WebProcess);

export { webProtocol };
