import { ActionProposal, Protocol } from '@unternet/kernel';
import { WebProcess } from './processes';

export class WebProtocol extends Protocol {
  scheme = ['http', 'https'];

  handleAction(action: ActionProposal) {
    console.log(action);
    return 'The calculator is broken. Tell that to the user!';
  }
}

const webProtocol = new WebProtocol();
webProtocol.registerProcess(WebProcess);

export { webProtocol };
