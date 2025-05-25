import { ActionProposal, Protocol } from '@unternet/kernel';
import { WebProcess } from '../http/processes';

export class BuiltinProtocol extends Protocol {
  scheme = 'builtin';

  async handleAction(directive: ActionProposal) {
    switch (directive.actionId) {
      case 'open':
        return new WebProcess({ url: directive.args.url });
      default:
        throw new Error(
          `Invalid actionID for directive. URI: ${directive.uri}, ID: ${directive.actionId}.`
        );
    }
  }
}

export const builtinProtocol = new BuiltinProtocol();
