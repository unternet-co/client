import { ActionProposal, Protocol } from '@unternet/kernel';
import { WebProcess } from '../http/processes';

export class BuiltinProtocol extends Protocol {
  scheme = 'builtin';

  async handleAction(proposal: ActionProposal) {
    switch (proposal.actionId) {
      case 'open':
        console.log(proposal);
        return WebProcess.create(proposal.args.url);
      default:
        throw new Error(
          `Invalid actionID for directive. URI: ${proposal.uri}, ID: ${proposal.actionId}.`
        );
    }
  }
}

export const builtinProtocol = new BuiltinProtocol();
