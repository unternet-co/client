import { ActionProposal, Protocol } from '@unternet/kernel';
import { WebProcess } from './processes';

export class WebProtocol extends Protocol {
  scheme = ['http', 'https'];

  // TODO: Make this a standard part of the kernel
  static createResource() {}

  async handleAction(action: ActionProposal) {
    const process = await WebProcess.create(action.uri);
    await process.handleAction(action);
    if (action.display === 'snippet') return process.data;
    return process;
  }
}

const webProtocol = new WebProtocol();
webProtocol.registerProcess(WebProcess);

export { webProtocol };
