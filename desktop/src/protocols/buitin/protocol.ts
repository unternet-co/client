import { ActionProposal, Protocol } from '@unternet/kernel';
import { WebProcess } from '../http/processes';
import { unternet } from '../../common/unternet';

export class BuiltinProtocol extends Protocol {
  scheme = 'builtin';

  async handleAction(directive: ActionProposal) {
    switch (directive.actionId) {
      case 'search':
        const results = await unternet.lookup.query({
          q: directive.args.q,
        });
        return results;
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
